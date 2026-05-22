import React, { useState, useRef, useEffect } from 'react';
import axiosInstance from '../../../utils/axiosClient';
import { Send, Bot, User, Sparkles, AlertTriangle, Terminal } from 'lucide-react';
import { toast } from 'sonner';

const AskAITab = ({ problem }) => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi! Ask me anything about this problem.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const { data } = await axiosInstance.post('/ai/chat', {
                messages: [...messages, userMsg], 
                title: problem.title,
                description: problem.description,
                testCases: problem.visibleTestCases,
                startCode: problem.startCode?.[0]?.initialCode || ""
            });

            const aiString = JSON.stringify(data.data);
            
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: aiString }
            ]);

        } catch (error) {
            const status = error.response?.status;
            let errorMessage = "Something went wrong. Please try again.";
            
            if (status === 500 || status === 503) {
                errorMessage = "The AI Tutor is currently helping a lot of students. Please try again in a few seconds!";
                toast.error("The AI Tutor is currently helping a lot of students. Please try again in a few seconds!");
            } else {
                toast.error(error.response?.data?.message || "Failed to get response from AI Tutor.");
            }

            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: errorMessage }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const renderContent = (msg) => {
        if (msg.role === 'user') return <p className="leading-relaxed">{msg.content}</p>;

        try {
            if (!msg.content.trim().startsWith('{')) return <p className="leading-relaxed">{msg.content}</p>;

            const ai = JSON.parse(msg.content);

            return (
                <div className="flex flex-col gap-4 text-sm w-full">
                    {/* Explanation Section */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-info font-bold text-[13px] uppercase tracking-wider">
                            <Sparkles size={14} className="animate-pulse" />
                            <span>Explanation</span>
                        </div>
                        <p className="text-base-content/90 leading-relaxed pl-1">{ai.explanation}</p>
                    </div>
                    
                    {/* Approach Section */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-error font-bold text-[13px] uppercase tracking-wider">
                            <Terminal size={14} />
                            <span>Approach</span>
                        </div>
                        <p className="text-base-content/90 leading-relaxed pl-1">{ai.approach}</p>
                    </div>

                    {/* Code Block */}
                    {ai.code && (
                        <div className="relative group">
                            <div className="mockup-code bg-black/90 text-gray-300 text-[11px] mt-1 before:hidden border border-white/10 shadow-xl">
                                <pre className="p-4 pt-2 overflow-x-auto">
                                    <code className="font-mono">{ai.code}</code>
                                </pre>
                            </div>
                        </div>
                    )}
                    
                    {/* Tips Section */}
                    {ai.tips?.length > 0 && (
                        <div className="bg-warning/10 border border-warning/20 p-3 rounded-xl flex items-start gap-2.5">
                             <AlertTriangle size={16} className="mt-0.5 text-warning shrink-0"/>
                             <span className="text-xs text-base-content/80 leading-snug">{ai.tips[0]}</span>
                        </div>
                    )}
                </div>
            );
        } catch (e) {
            return msg.content;
        }
    };

    return (
        <div className="flex flex-col h-full bg-base-100 relative">
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto px-4 pt-6 space-y-8 pb-48 scrollbar-thin scrollbar-thumb-base-300">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex w-full gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar Wrapper  */}
                        <div className="flex flex-col justify-start">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                                msg.role === 'user' 
                                ? 'bg-primary/10 border-primary/20 text-primary' 
                                : 'bg-base-200 border-base-300 text-base-content/60'
                            }`}>
                                {msg.role === 'user' ? <User size={16}/> : <Bot size={16}/>}
                            </div>
                        </div>

                        {/* Bubble */}
                        <div className={`max-w-[85%] md:max-w-[75%] px-4 py-3 shadow-sm border ${
                            msg.role === 'user' 
                                ? 'bg-primary text-primary-content rounded-2xl rounded-tr-none border-primary/10' 
                                : 'bg-base-200/50 text-base-content rounded-2xl rounded-tl-none border-base-300'
                        }`}>
                            {renderContent(msg)}
                        </div>
                    </div>
                ))}
                
                {loading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-xl bg-base-200 flex items-center justify-center animate-pulse">
                            <Bot size={16} className="text-base-content/30" />
                        </div>
                        <div className="bg-base-200/50 border border-base-300 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
                            <span className="loading loading-dots loading-xs opacity-50"></span>
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            {/* Input Form Area */}
            <div className="absolute bottom-0 w-full bg-gradient-to-t from-base-100 via-base-100 to-transparent pt-10">
                <div className="p-4 pt-0">
                    <div className="relative max-w-4xl mx-auto group">
                        <textarea 
                            className="textarea textarea-bordered w-full pr-14 pl-4 py-3 resize-none text-[13px] rounded-2xl bg-base-100 shadow-2xl border-base-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[80px]"
                            placeholder="Type your doubt here... (Shift + Enter for new line)"
                            rows="2"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if(e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            disabled={loading}
                        />
                        <button 
                            className={`absolute right-3 bottom-3 btn btn-circle btn-sm shadow-md transition-all ${
                                input.trim() ? 'btn-primary scale-100' : 'btn-ghost scale-90 opacity-50'
                            }`}
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                        >
                            <Send size={16} />
                        </button>
                    </div>

                    {/* Disclaimer Footer */}
                    <div className="mt-3 text-center">
                        <p className="text-[10px] text-base-content/40 font-medium tracking-tight flex items-center justify-center gap-1.5 uppercase">
                            <Bot size={12} />
                            AI can make mistakes. Please verify the logic.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AskAITab;