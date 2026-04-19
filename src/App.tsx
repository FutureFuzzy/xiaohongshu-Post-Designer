/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, forwardRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Share2, Download, Layout, Type as TypeIcon, Image as ImageIcon, Loader2, Sparkles, Copy, Check, Send } from 'lucide-react';
import { toPng } from 'html-to-image';
import { GoogleGenAI, Type } from "@google/genai";

// --- Constants & Types ---

const ASPECT_RATIO = 3 / 4;

interface PageContent {
  id: number;
  title: string;
  content: string[];
  highlight?: string;
  footer?: string;
}

const INITIAL_PAGES: PageContent[] = [
  {
    id: 1,
    title: "极致轻量化：1人公司神话",
    content: [
      "成都“碳基圈”项目彻底刷屏",
      "颠覆传统认知的公司结构：",
      "全公司仅 1 个真人创始人",
      "剩下 7 个员工全部是 AI"
    ],
    highlight: "运营成本压到最低，效率拉满",
    footer: "AI 不用发薪资、不用管理、不会摸鱼"
  },
  {
    id: 2,
    title: "核心业务：AI 协同 + 轻任务",
    content: [
      "用户发布：文案撰写、日常打卡、情绪陪伴、简单调研",
      "AI 负责：需求匹配、后台运营、智能客服、流量分发",
      "普通人完成任务赚取报酬",
      "兼顾情绪倾诉与轻社交功能"
    ],
    highlight: "AI 全程负责，真人只需决策",
    footer: "极致的自动化流程"
  },
  {
    id: 3,
    title: "炸裂数据：半个月估值 3000 万",
    content: [
      "核心团队：1 位创始人 + 7 个 AI 员工",
      "上线时长：仅半个月",
      "用户规模：突破 4 万人",
      "平台曝光：百万级访问量"
    ],
    highlight: "天使轮估值直接达到 3000 万",
    footer: "纯靠 AI 提效 + 模式创新"
  },
  {
    id: 4,
    title: "深度思考：AI 时代的超级个体",
    content: [
      "打破传统创业门槛：不再堆人力、耗资金",
      "AI 是最听话、最高效的得力助手",
      "未来的竞争：比拼谁更懂利用 AI",
      "超级个体、一人公司已成新趋势"
    ],
    highlight: "一个人就能撑起一整个项目",
    footer: "AI 不是对手，而是助手"
  }
];

// --- Gemini Service ---

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const COVER_SKILL_PROMPT = `
你是一个专业的小红书封面设计专家。你的任务是根据用户提供的文案，生成符合“赛博二次元马卡龙手绘”风格的封面设计方案。

执行规则：
1. 提取核心流量钩子：锁定文案中最具反差感的数字或观点。
2. 锁定封面文字：主标题用核心钩子，副标题补充核心人群/结论。
3. 提取可视化元素：提炼可手绘的赛博元素（AI机器人、真人剪影、数据流、科技图标等）。
4. 对下 2/3 画面区的强制负向约束：生成的画面中禁止出现任何文字、字母、数字、标题或字符（NO TEXT, NO LETTERS, NO CHARACTERS IN IMAGE）。画面必须是纯粹的插画。
5. 强制规范：3:4比例，上1/3文字区由程序生成，下2/3画面区由AI绘图，纯白背景，扁平手绘风格，马卡龙明亮撞色。
`;

const INNER_PAGE_SKILL_PROMPT = `
你是一个专业的小红书内容排版专家。你的任务是将用户提供的长文案进行逻辑拆解，生成一组（3-5张）符合“商业内页”风格的幻灯片内容。

执行规则：
1. 逻辑拆解：将文案分为“引流/背景”、“痛点/现状”、“核心方案/逻辑”、“成果/数据”、“深度思考/金句”等模块。
2. 每页内容：
   - title: 极其精炼的标题（不超过 15 字）。
   - content: 3-4 条核心要点，每条要点简短有力。
   - highlight: 对应页面的点睛金句。
   - footer: 简短的注脚或关键词。
3. 保持 3:4 比例的排版思维。
4. 返回格式：JSON 数组，每个元素包含 id, title, content (string[]), highlight, footer。
`;

// --- Components ---
const InnerPageGenerator = ({ onPagesGenerated }: { onPagesGenerated: (pages: PageContent[]) => void }) => {
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [INNER_PAGE_SKILL_PROMPT, inputText],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.NUMBER },
                title: { type: Type.STRING },
                content: { type: Type.ARRAY, items: { type: Type.STRING } },
                highlight: { type: Type.STRING },
                footer: { type: Type.STRING }
              },
              required: ["id", "title", "content", "highlight", "footer"]
            }
          }
        }
      });
      
      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text.trim());
        onPagesGenerated(parsed);
      }
    } catch (err) {
      console.error('Inner page generation failed:', err);
      setError('文案解析失败，请检查网络或文案长度');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-xl shadow-cyber-indigo/5 border border-cyber-indigo/5 mb-10 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-black text-cyber-indigo flex items-center gap-2">
          <Send className="w-5 h-5 text-macaron-purple" />
          全自动内页排版 (AI-Powered)
        </h3>
      </div>
      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="粘贴你的深度文案，AI 将自动拆解为 4-5 张精美内页..."
        className="w-full h-32 p-4 rounded-xl bg-slate-50 border-2 border-transparent focus:border-macaron-purple focus:bg-white transition-all outline-none text-cyber-indigo font-medium resize-none text-sm"
      />
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !inputText.trim()}
        className="mt-4 w-full py-4 bg-cyber-indigo text-white rounded-xl font-black flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all shadow-lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>AI 逻辑拆解中...</span>
          </>
        ) : (
          <>
            <Layout className="w-5 h-5" />
            <span>开始全自动排版</span>
          </>
        )}
      </button>
      {error && <p className="mt-4 text-xs font-bold text-red-500 text-center uppercase tracking-widest">⚠️ {error}</p>}
    </div>
  );
};

const InnerPage = forwardRef<HTMLDivElement, { page: PageContent }>(({ page }, ref) => {
  return (
    <div 
      ref={ref}
      className="relative bg-white w-full h-full flex flex-col p-12 overflow-hidden select-none"
      style={{ aspectRatio: ASPECT_RATIO }}
    >
      {/* Dynamic Background Gradients */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-macaron-cyan/40 rounded-full blur-[100px] -mr-40 -mt-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-macaron-pink/40 rounded-full blur-[100px] -ml-40 -mb-20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] pointer-events-none">
        <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(#2D1B69 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
      </div>

      {/* Decorative Cyber Lines */}
      <div className="absolute inset-8 border border-cyber-indigo/10 pointer-events-none z-20" />
      <div className="absolute top-8 left-8 w-1 h-1 bg-cyber-indigo opacity-30" />
      <div className="absolute top-8 right-8 w-1 h-1 bg-cyber-indigo opacity-30" />
      <div className="absolute bottom-8 left-8 w-1 h-1 bg-cyber-indigo opacity-30" />
      <div className="absolute bottom-8 right-8 w-1 h-1 bg-cyber-indigo opacity-30" />

      {/* Header Meta */}
      <div className="flex justify-between items-center mb-12 z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-macaron-pink rounded-full animate-pulse" />
          <span className="text-[14px] font-black text-cyber-indigo tracking-[0.1em]">INSIGHT 0{page.id}</span>
        </div>
        <div className="px-3 py-1 bg-cyber-indigo text-white text-[10px] font-black rounded-sm transform -rotate-1 skew-x-3 shadow-sm">
          CARBON CIRCLE
        </div>
      </div>

      {/* Content Container */}
      <div className="flex-1 flex flex-col z-10">
        {/* Title Area */}
        <div className="mb-10">
          <h2 className="text-4xl font-black text-cyber-indigo leading-[1.1] tracking-tighter">
            {page.title}
          </h2>
          <div className="mt-4 flex gap-1">
            <div className="h-1.5 w-12 bg-macaron-cyan rounded-full" />
            <div className="h-1.5 w-3 bg-macaron-pink rounded-full" />
          </div>
        </div>

        {/* List Content */}
        <ul className="space-y-6 mb-10">
          {page.content.map((item, index) => (
            <li key={index} className="flex items-start group">
              <div className="mr-4 mt-1.5 w-3 h-3 border-2 border-macaron-purple bg-white rounded-full flex-shrink-0 group-hover:bg-macaron-purple transition-colors" />
              <p className="text-[19px] text-cyber-indigo/80 leading-snug font-bold">
                {item}
              </p>
            </li>
          ))}
        </ul>

        {/* Highlight Glass Box */}
        {page.highlight && (
          <div className="mt-auto bg-white/40 backdrop-blur-md p-6 rounded-2xl border border-white shadow-[0_8px_32px_rgba(45,27,105,0.05)]">
            <p className="text-2xl font-black text-cyber-indigo italic leading-tight text-center bg-gradient-to-r from-cyber-indigo via-purple-600 to-cyber-indigo bg-clip-text text-transparent">
              “{page.highlight}”
            </p>
          </div>
        )}
      </div>

      {/* Footer Meta */}
      <div className="mt-8 flex justify-between items-end z-10">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-cyber-indigo/40 uppercase tracking-[0.2em]">{page.footer}</p>
          <div className="flex gap-2 pt-1">
            {["AI", "HACK", "3000W"].map(t => (
              <span key={t} className="text-[8px] font-bold px-1.5 py-0.5 bg-macaron-cyan/30 text-cyber-indigo rounded-full">#{t}</span>
            ))}
          </div>
        </div>
        <div className="text-6xl font-black text-macaron-pink/20 select-none">
          0{page.id}
        </div>
      </div>
    </div>
  );
});

InnerPage.displayName = 'InnerPage';

const CoverGenerator = () => {
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    setIsGenerating(true);
    setError(null);
    setGeneratedImageUrl(null);
    setResult(null);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [COVER_SKILL_PROMPT, inputText],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hook: { type: Type.STRING },
              mainTitle: { type: Type.STRING },
              subTitle: { type: Type.STRING },
              imageContent: { type: Type.STRING },
              promptCN: { type: Type.STRING },
              promptEN: { type: Type.STRING }
            },
            required: ["hook", "mainTitle", "subTitle", "imageContent", "promptCN", "promptEN"]
          }
        }
      });
      
      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text.trim());
        setResult(parsed);
        setIsGenerating(false); // Finish text generation state
        // Trigger image generation without blocking the UI rendering of text
        handleGenerateImage(parsed.promptEN);
      }
    } catch (err) {
      console.error('Generation failed:', err);
      setError('文案解析失败，请稍后重试');
      setIsGenerating(false);
    }
  };

  const handleGenerateImage = async (prompt: string) => {
    setIsGeneratingImage(true);
    setError(null);
    const cleanPrompt = `${prompt}, simple flat illustration, minimalist background, absolute no text, no characters, no letters, no watermark, clean composition`;
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ text: cleanPrompt }],
        config: {
          imageConfig: {
            aspectRatio: "3:4"
          }
        }
      });

      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        let foundImage = false;
        for (const part of parts) {
          if (part.inlineData) {
            const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            setGeneratedImageUrl(imageUrl);
            foundImage = true;
            break;
          }
        }
        if (!foundImage) throw new Error('No image returned');
      } else {
        throw new Error('No response parts');
      }
    } catch (err) {
      console.error('Image generation failed:', err);
      setError('画面生成较慢或失败，您可以点击右侧按钮重试');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const coverRef = useRef<HTMLDivElement>(null);

  const downloadFullCover = async () => {
    if (!coverRef.current) return;
    try {
      const dataUrl = await toPng(coverRef.current, { pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = 'xiaohongshu-cover.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-8 rounded-3xl shadow-xl shadow-cyber-indigo/5 border border-cyber-indigo/5">
        <h3 className="text-xl font-black text-cyber-indigo mb-6 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-macaron-pink" />
          全自动封面生成 (AI-Powered)
        </h3>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="粘贴你的文案内容，AI 将直接为你合成完整封面图..."
          className="w-full h-40 p-6 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-macaron-cyan focus:bg-white transition-all outline-none text-cyber-indigo font-medium resize-none shadow-inner"
        />
        <button
          onClick={handleGenerate}
          disabled={isGenerating || isGeneratingImage || !inputText.trim()}
          className="mt-6 w-full py-5 bg-cyber-indigo text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all shadow-xl shadow-cyber-indigo/30"
        >
          {isGenerating || isGeneratingImage ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>{isGenerating ? '分析文案中...' : 'AI 绘制画面中...'}</span>
            </>
          ) : (
            <>
              <ImageIcon className="w-6 h-6 " />
              <span>直接生成完整封面图</span>
            </>
          )}
        </button>
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold animate-in fade-in slide-in-from-top-2">
            ⚠️ {error}
          </div>
        )}
      </div>

      {result && (
        <div className="space-y-8 animate-in zoom-in-95 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Logic Info */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-cyber-indigo/5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-macaron-pink">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Parsing Logic</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-cyber-indigo/40 label uppercase mb-1">流量钩子</p>
                  <p className="text-sm font-black text-cyber-indigo leading-tight">{result.hook}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-cyber-indigo/40 label uppercase mb-1">主标题</p>
                  <p className="text-sm font-black text-cyber-indigo">{result.mainTitle}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-cyber-indigo/40 label uppercase mb-1">副标题</p>
                  <p className="text-sm font-black text-cyber-indigo">{result.subTitle}</p>
                </div>
              </div>
              
              <div className="bg-cyber-indigo p-6 rounded-2xl space-y-4 shadow-lg">
                <div className="flex items-center gap-2 text-macaron-cyan">
                  <TypeIcon className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Prompt Engineering</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-white/40">English Prompt</span>
                    <button onClick={() => copyToClipboard(result.promptEN, 'en')} className="hover:text-white text-white/40"><Copy className="w-3 h-3" /></button>
                  </div>
                  <div className="text-[10px] text-white/80 line-clamp-4 font-mono leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                    {result.promptEN}
                  </div>
                </div>
              </div>
            </div>

            {/* Final Outcome Render */}
            <div className="lg:col-span-8 flex flex-col items-center">
              <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl shadow-cyber-indigo/10 border-8 border-white">
                <div 
                  ref={coverRef}
                  className="relative bg-white overflow-hidden shadow-inner"
                  style={{ width: '400px', height: '533px', aspectRatio: '3/4' }}
                >
                  {/* Top 1/3: Text Area */}
                  <div className="h-1/3 w-full bg-white flex flex-col items-center justify-center px-6 text-center select-none">
                    <h1 className="text-3xl font-[900] text-cyber-indigo leading-tight mb-2 tracking-tighter">
                      {result.mainTitle}
                    </h1>
                    <div className="h-1 w-16 bg-macaron-cyan rounded-full mb-3" />
                    <p className="text-sm font-black text-macaron-pink tracking-tight">
                      {result.subTitle}
                    </p>
                  </div>

                  {/* Bottom 2/3: Image Area */}
                  <div className="h-2/3 w-full bg-slate-50 relative">
                    {generatedImageUrl ? (
                      <img 
                        src={generatedImageUrl} 
                        alt="Generated Visual" 
                        className="w-full h-full object-cover animate-in fade-in duration-1000"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-4">
                        <Loader2 className="w-12 h-12 text-cyber-indigo/10 animate-spin" />
                        <p className="text-[10px] font-black text-cyber-indigo/20 uppercase tracking-[0.3em]">Rendering Cyber Visuals...</p>
                      </div>
                    )}
                    {/* Removed Decorative Watermark */}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  onClick={downloadFullCover}
                  disabled={!generatedImageUrl}
                  className="px-8 py-3 bg-cyber-indigo text-white rounded-full font-black text-sm flex items-center gap-3 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-xl"
                >
                  <Download className="w-5 h-5" /> 下载完整高清封面图
                </button>
                <button
                  onClick={() => handleGenerateImage(result.promptEN)}
                  disabled={isGeneratingImage}
                  className="px-8 py-3 bg-white text-cyber-indigo border-2 border-cyber-indigo/10 rounded-full font-black text-sm flex items-center gap-3 hover:bg-slate-50 active:scale-95 transition-all"
                >
                  <Sparkles className="w-5 h-5 text-macaron-purple" /> 重新生成画面
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'inner' | 'cover'>('inner');
  const [pages, setPages] = useState<PageContent[]>(INITIAL_PAGES);
  const [currentPage, setCurrentPage] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const next = () => setCurrentPage((prev) => (prev + 1) % pages.length);
  const prev = () => setCurrentPage((prev) => (prev - 1 + pages.length) % pages.length);

  const handlePagesGenerated = (newPages: PageContent[]) => {
    setPages(newPages);
    setCurrentPage(0);
  };

  const handleExport = async () => {
    if (!canvasRef.current) return;
    
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const dataUrl = await toPng(canvasRef.current, {
        pixelRatio: 3,
        quality: 1,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `xh-inner-0${pages[currentPage].id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFE] flex flex-col items-center p-4 md:p-8 font-sans overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-10 left-10 w-96 h-96 bg-macaron-pink rounded-full blur-[150px]" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-macaron-cyan rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <header className="w-full max-w-4xl mb-12 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-cyber-indigo flex items-center gap-3 italic">
            <div className="w-8 h-8 bg-cyber-indigo rounded-full flex items-center justify-center p-1.5 shadow-lg shadow-cyber-indigo/20">
              <Layout className="w-full h-full text-white" />
            </div>
            XH_STUDIO.v2
          </h1>
          <p className="text-xs font-bold text-cyber-indigo/40 tracking-[0.3em] uppercase mt-2">Cyber Macaron Creative Suite</p>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex bg-white p-1.5 rounded-2xl shadow-lg shadow-cyber-indigo/5 border border-cyber-indigo/5">
          <button
            onClick={() => setActiveTab('inner')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${
              activeTab === 'inner' ? 'bg-cyber-indigo text-white shadow-md' : 'text-cyber-indigo/40 hover:text-cyber-indigo'
            }`}
          >
            <Layout className="w-4 h-4" />
            内页设计
          </button>
          <button
            onClick={() => setActiveTab('cover')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${
              activeTab === 'cover' ? 'bg-cyber-indigo text-white shadow-md' : 'text-cyber-indigo/40 hover:text-cyber-indigo'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            封面生成
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-4xl relative z-10">
        {activeTab === 'inner' ? (
          <div className="space-y-10">
            <InnerPageGenerator onPagesGenerated={handlePagesGenerated} />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Page Selector */}
              <aside className="lg:col-span-3 order-2 lg:order-1 flex lg:flex-col gap-3 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide">
                {pages.map((page, idx) => (
                  <button
                    key={page.id}
                    onClick={() => setCurrentPage(idx)}
                    className={`flex-shrink-0 w-28 lg:w-full p-4 rounded-2xl border-2 transition-all text-left group ${
                      currentPage === idx 
                        ? 'border-cyber-indigo bg-cyber-indigo text-white shadow-xl shadow-cyber-indigo/20' 
                        : 'border-cyber-indigo/5 bg-white text-cyber-indigo hover:border-cyber-indigo/20'
                    }`}
                  >
                    <p className={`text-[10px] font-black mb-1 tracking-tighter ${currentPage === idx ? 'text-macaron-pink' : 'text-cyber-indigo/40'}`}>PAGE // 0{page.id}</p>
                    <p className="text-xs font-black line-clamp-2 leading-tight uppercase">
                      {page.title}
                    </p>
                  </button>
                ))}
              </aside>

              {/* Canvas Area */}
              <section className="lg:col-span-9 order-1 lg:order-2 flex flex-col items-center gap-8">
                <div className="relative w-full max-w-[500px] shadow-[0_40px_80px_-15px_rgba(45,27,105,0.15)] rounded-2xl overflow-hidden bg-white ring-1 ring-cyber-indigo/5">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentPage}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.02 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="w-full"
                    >
                      <InnerPage ref={canvasRef} page={pages[currentPage]} />
                    </motion.div>
                  </AnimatePresence>

                  {/* Navigation Arrows */}
                  <button 
                    onClick={prev}
                    className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-white shadow-xl rounded-full flex items-center justify-center z-30 hover:scale-110 active:scale-95 transition-all border border-cyber-indigo/5"
                  >
                    <ChevronLeft className="w-6 h-6 text-cyber-indigo" />
                  </button>
                  <button 
                    onClick={next}
                    className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-white shadow-xl rounded-full flex items-center justify-center z-30 hover:scale-110 active:scale-95 transition-all border border-cyber-indigo/5"
                  >
                    <ChevronRight className="w-6 h-6 text-cyber-indigo" />
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button 
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-8 py-3 bg-cyber-indigo text-white rounded-2xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-xl shadow-cyber-indigo/20 text-sm font-black"
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {isExporting ? 'RENDERING...' : 'EXPORT_INNER_PAGE'}
                  </button>
                </div>
              </section>
            </div>
          </div>
        ) : (
          <CoverGenerator />
        )}
      </main>

      {/* Footer Info */}
      <footer className="mt-24 text-cyber-indigo/20 text-[9px] font-black tracking-[0.4em] uppercase text-center max-w-lg leading-loose">
        Protocol initialized: Cyber_Macaron_v2 // <br/>
        Design System // High_Intensity_Layout // 3:4_SAFE_ZONE
      </footer>
    </div>
  );
}
