"use client";

import { Loader2, ExternalLink, Edit3, Trash2 } from "lucide-react";

interface ContentArchitectProps {
    contentForm: any;
    setContentForm: (form: any) => void;
    syllabusData: any[];
    customFolders: any[];
    uploadingContent: boolean;
    contentError: string;
    contentSuccess: string;
    handleUpdateContent: (e: React.FormEvent) => void;
    contentOnlyEntries: any[];
    detectFolderFromCode: (code: string) => string;
    handleDeleteContent: (id: string) => void;
}

export default function ContentArchitect({
    contentForm,
    setContentForm,
    syllabusData,
    customFolders,
    uploadingContent,
    contentError,
    contentSuccess,
    handleUpdateContent,
    contentOnlyEntries,
    detectFolderFromCode,
    handleDeleteContent
}: ContentArchitectProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <form onSubmit={handleUpdateContent} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-[#0E5858]/5 space-y-8">
                <header className="mb-4">
                    <h3 className="text-xl font-serif text-[#0E5858]">Synchronize Masterclass Node</h3>
                    <p className="text-[10px] text-gray-400 font-medium mt-1">Deploy dynamic segments directly to the academy frontend.</p>
                </header>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-[#0E5858]/50 uppercase tracking-[0.2em] ml-3">Target Module</label>
                        <select
                            value={contentForm.moduleId}
                            onChange={(e) => setContentForm({ ...contentForm, moduleId: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-6 text-sm font-semibold focus:ring-2 focus:ring-[#00B6C1]/10 outline-none"
                            required
                        >
                            <option value="">Select Target Module</option>
                            {syllabusData.map(m => (
                                <option key={m.id} value={m.id}>{m.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-[#0E5858]/50 uppercase tracking-[0.2em] ml-3">Topic / Segment Title</label>
                        <input
                            type="text"
                            value={contentForm.topicTitle}
                            onChange={(e) => setContentForm({ ...contentForm, topicTitle: e.target.value })}
                            placeholder="e.g. Deep Dive into PCOS Protocols"
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-6 text-sm font-semibold focus:ring-2 focus:ring-[#00B6C1]/10 outline-none"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-[#0E5858]/50 uppercase tracking-[0.2em] ml-3">Resource Type</label>
                            <select
                                value={contentForm.contentType}
                                onChange={(e) => setContentForm({ ...contentForm, contentType: e.target.value as any })}
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-6 text-sm font-semibold focus:ring-2 focus:ring-[#00B6C1]/10 outline-none"
                            >
                                <option value="video">Video Session</option>
                                <option value="pdf">Protocol (PDF)</option>
                                <option value="link">External Resource</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-[#0E5858]/50 uppercase tracking-[0.2em] ml-3">Resource Link</label>
                            <input
                                type="url"
                                value={contentForm.contentLink}
                                onChange={(e) => setContentForm({ ...contentForm, contentLink: e.target.value })}
                                placeholder="https://..."
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-6 text-sm font-semibold focus:ring-2 focus:ring-[#00B6C1]/10 outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-[#0E5858]/50 uppercase tracking-[0.2em] ml-3">Content Bank Folder</label>
                        <select
                            value={contentForm.folder}
                            onChange={(e) => setContentForm({ ...contentForm, folder: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-6 text-sm font-semibold focus:ring-2 focus:ring-[#00B6C1]/10 outline-none"
                        >
                            <option value="">No Folder (General)</option>
                            {customFolders.map(f => (
                                <option key={f.id} value={f.name}>{f.name} ({f.prefix})</option>
                            ))}
                        </select>
                        <p className="text-[8px] text-gray-400 font-medium ml-3 mt-1">Assign to a Content Bank folder so it appears under that category tab.</p>
                    </div>
                    <div className="space-y-2 mt-4">
                        <label className="text-[9px] font-black text-[#0E5858]/50 uppercase tracking-[0.2em] ml-3">Search Tags</label>
                        <input
                            type="text"
                            value={contentForm.tags || ''}
                            onChange={(e) => setContentForm({ ...contentForm, tags: e.target.value })}
                            placeholder="e.g. PCOS, thyroid, weight loss (comma separated)"
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-6 text-sm font-semibold focus:ring-2 focus:ring-[#00B6C1]/10 outline-none"
                        />
                        <p className="text-[8px] text-gray-400 font-medium ml-3 mt-1">Tags help mentors find resources instantly via the search bar.</p>
                    </div>
                </div>

                {contentError && <p className="text-red-500 text-[10px] font-bold text-center">{contentError}</p>}
                {contentSuccess && <p className="text-green-500 text-[10px] font-bold text-center">{contentSuccess}</p>}

                <button
                    type="submit"
                    disabled={uploadingContent}
                    className="w-full py-5 bg-[#0E5858] text-white rounded-xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-[#00B6C1] transition-all"
                >
                    {uploadingContent ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Synchronize Architecture"}
                </button>
            </form>


            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-[#0E5858]/5 overflow-hidden flex flex-col max-h-[1000px]">
                <h3 className="text-xl font-serif text-[#0E5858] mb-6">Active Resource Nodes</h3>
                <div className="space-y-3 overflow-y-auto pr-2 scrollbar-hide">
                    {contentOnlyEntries.map(content => (
                        <div key={content.id} className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 flex items-center justify-between group">
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-[#0E5858] truncate">{content.title}</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">{content.module_id}</p>
                                    {(() => {
                                        const folder = detectFolderFromCode(content.topic_code || '');
                                        return folder ? <span className="text-[7px] font-black text-white bg-[#00B6C1] px-2 py-0.5 rounded-md uppercase tracking-widest">{folder}</span> : null;
                                    })()}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <a href={content.content} target="_blank" className="p-2 text-gray-300 hover:text-[#00B6C1] transition-all"><ExternalLink size={12} /></a>
                                <button
                                    onClick={() => {
                                        setContentForm({
                                            id: content.id,
                                            topicCode: content.topic_code,
                                            moduleId: content.module_id,
                                            topicTitle: content.title,
                                            contentType: content.content_type || 'video',
                                            contentLink: content.content,
                                            folder: detectFolderFromCode(content.topic_code || ''),
                                            tags: (content as any).tags ? (Array.isArray((content as any).tags) ? (content as any).tags.join(', ') : (content as any).tags) : ''
                                        });
                                    }}
                                    className="p-2 text-gray-300 hover:text-[#00B6C1] transition-all"
                                >
                                    <Edit3 size={12} />
                                </button>
                                <button onClick={() => handleDeleteContent(content.id)} className="p-2 text-gray-300 hover:text-red-500 transition-all"><Trash2 size={12} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
