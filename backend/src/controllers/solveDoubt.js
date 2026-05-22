const { GoogleGenAI, Type } = require("@google/genai");
const Problem = require("../models/problem");
const { getLanguageId, submitBatch, submitToken, buildFullSourceCode } = require("../utils/judge0Helper");

// DEFINE THE TOOL 
const executeCodeTool = {
  name: "executeCodeInSandbox",
  description: "Executes a code snippet against standard test cases in a secure sandbox and returns the run logs.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      code: { 
        type: Type.STRING, 
        description: "The raw user code snippet to test. Extract ONLY the core solution class/functions/methods. DO NOT include the 'main' function, driver code, library imports/headers, or markdown backticks, as they are automatically provided by the sandbox wrapper." 
      },
      language: { type: Type.STRING, description: "Programming language used." }
    },
    required: ["code", "language"],
  },
};

//  HELPER FUNCTION TO PROTECT FRONTEND
const sendSafeJsonResponse = (res, rawText) => {
  let parsedResponse;
  try {
    const text = rawText || "";
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    const jsonString = text.slice(firstBrace, lastBrace + 1);
    parsedResponse = JSON.parse(jsonString);
    
    return res.status(200).json({ success: true, data: parsedResponse });
  } catch (e) {
    return res.status(502).json({ success: false, message: "AI Agent returned invalid JSON", raw: rawText });
  }
};

const stripMain = (code, language) => {
  const lang = (language || "").toLowerCase();
  if (lang === "cpp" || lang === "c++" || lang === "c" || lang === "java" || lang === "javascript" || lang === "python") {
    let mainIndex = -1;
    if (lang === "python") {
      const match = code.match(/(def\s+main\b|if\s+__name__\s*==\s*['"]__main__['"])/);
      if (match) {
        mainIndex = match.index;
      }
    } else {
      const match = code.match(/(?:int|void|public\s+static\s+void|static\s+void)?\s*main\s*\(/);
      if (match) {
        mainIndex = match.index;
      }
    }

    if (mainIndex !== -1) {
      return code.substring(0, mainIndex).trim();
    }
  }
  return code;
};

const solveDoubt = async (req, res) => {
  try {
    const { messages, title, description, testCases, startCode } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: "messages must be a non-empty array" });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });
    const history = messages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content || msg.text || "" }]
    }));

    //  SYSTEM PROMPT
    const systemInstruction = `
You are an autonomous, elite Data Structures and Algorithms (DSA) tutor agent.

[CONTEXT]
Problem: ${title}
Description: ${description}
Examples: ${JSON.stringify(testCases)}
Initial Code: ${startCode}

[AGENTIC WORKFLOW & TOOL RULES]
1. You have access to the 'executeCodeInSandbox' tool. 
2. If the user presents buggy code or asks for a solution, YOU MUST call the tool to verify the code logic against hidden test cases before providing your final explanation.
3. Do not guess the error. Run it, read the logs, and then explain.
4. When calling 'executeCodeInSandbox', extract ONLY the user's core solution class or function. DO NOT include the 'main' function, driver code, or library headers/imports in the 'code' parameter, as the sandbox wrapper will automatically prepend/append them.

[FINAL OUTPUT CONSTRAINTS]
When you are ready to provide the final answer (after tool use, or if no tool was needed), you MUST respond in pure JSON matching this exact schema:
{
  "explanation": "Deep conceptual explanation based on execution logs",
  "approach": "Step-by-step algorithm logic",
  "code": "Fully corrected and optimized code snippet",
  "tips": ["Time/Space complexity breakdown", "Common edge cases"]
}
    `;

    //  INITIAL AGENT CALL (Deciding to use tools or not)
    const initialResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2,
        tools: [{ functionDeclarations: [executeCodeTool] }]
      },
      contents: history
    });

    const functionCalls = initialResponse.functionCalls;

    //  THE AGENT LOOP (Executing the tool)
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      
      if (call.name === "executeCodeInSandbox") {
        
        let executionResult = { success: false, logs: "" };
        try {
          const { code, language: lang } = call.args;
          if (!code || !lang) {
            throw new Error("Missing code or language arguments for sandbox execution");
          }
          let cleanCode = code.replace(/```[a-z]*\n/gi, "").replace(/```/g, "").trim();

          let language = lang.toLowerCase();
          language = language === "cpp" ? "c++" : language;

          const languageId = getLanguageId(language);
          if (!languageId) {
            throw new Error(`Unsupported language: ${language}`);
          }

          const cleanTitle = title ? title.trim() : "";
          let problem = await Problem.findOne({ title: cleanTitle });
          if (!problem && title) {
            problem = await Problem.findOne({
              title: { $regex: new RegExp("^" + cleanTitle.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i") }
            });
          }

          let fullSourceCode;
          if (problem) {
            const strippedCode = stripMain(cleanCode, language);
            fullSourceCode = buildFullSourceCode({ problem, language, userCode: strippedCode });
          } else {
            fullSourceCode = cleanCode;
          }

          const testCasesToUse = problem ? problem.visibleTestCases : (testCases || []);
          if (testCasesToUse.length === 0) {
            throw new Error("No test cases found to run the code snippet against");
          }
          console.log(fullSourceCode);
          
          const batchSubmissions = testCasesToUse.map(tc => ({
            source_code: fullSourceCode,
            language_id: languageId,
            stdin: tc.input,
            expected_output: tc.output
          }));

          const submitResult = await submitBatch(batchSubmissions);
          const tokens = submitResult.map(s => s.token);
          const results = await submitToken(tokens);

          let passedCount = 0;
          let totalCount = results.length;
          let logs = "";
          let success = true;

          for (let i = 0; i < results.length; i++) {
            const test = results[i];
            if (test.status.id === 3) {
              passedCount++;
            } else {
              success = false;
              if (test.status.id === 4) {
                logs += `Test Case ${i + 1} Failed: Wrong Answer\nInput: ${test.stdin || ''}\nOutput: ${test.stdout || ''}\nExpected: ${test.expected_output || ''}\n`;
              } else if (test.status.id === 5) {
                logs += `Test Case ${i + 1} Failed: Time Limit Exceeded\n`;
              } else {
                const errMsg = test.compile_output || test.stderr || (test.status && test.status.description) || "Runtime Error";
                logs += `Test Case ${i + 1} Failed: ${errMsg}\n`;
              }
              break;
            }
          }

          if (success) {
            logs = `All ${totalCount} test cases passed successfully.`;
          } else {
            logs = `Passed ${passedCount}/${totalCount} test cases.\n\n${logs}`;
          }

          executionResult = { success, logs };

        } catch (err) {
          console.error("Error executing code via Judge0 in sandbox tool:", err);
          executionResult = {
            success: false,
            logs: `Execution failed: ${err.message}`
          };
        }

        // FINAL GENERATION (Forcing the JSON format after seeing the logs)
        const finalAgentResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.2,
            responseMimeType: "application/json" 
          },
          contents: [
            ...history,
            initialResponse.candidates && initialResponse.candidates[0]
              ? initialResponse.candidates[0].content
              : { role: "model", parts: [{ functionCall: call }] },
            { role: "user", parts: [{ functionResponse: { name: call.name, response: { result: executionResult } } }] }
          ]
        });

        return sendSafeJsonResponse(res, finalAgentResponse.text);
      }
    }

    //  FALLBACK (If the AI decided it didn't need to run code, e.g., theory question)
    const fallbackResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.2,
            responseMimeType: "application/json"
        },
        contents: history
    });

    return sendSafeJsonResponse(res, fallbackResponse.text);

  } catch (err) {
    console.error("Agent API Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = solveDoubt;