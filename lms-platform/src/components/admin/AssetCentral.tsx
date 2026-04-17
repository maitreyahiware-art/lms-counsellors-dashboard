"use client";

import { FolderOpen, Pencil, Trash2, Plus, CheckCircle, X } from "lucide-react";
import { useState, useMemo } from "react";

interface Folder {
    id: string;
    name: string;
    prefix: string;
}

interface AssetCentralProps {
    customFolders: Folder[];
    renamingFolderId: string | null;
    setRenamingFolderId: (id: string | null) => void;
    renameFolderValue: string;
    setRenameFolderValue: (val: string) => void;
    newFolderName: string;
    setNewFolderName: (val: string) => void;
    newFolderPrefix: string;
    setNewFolderPrefix: (val: string) => void;
    handleCreateFolder: () => void;
    handleRenameFolder: (id: string) => void;
    handleDeleteFolder: (id: string) => void;
}

export default function AssetCentral({
    customFolders,
    renamingFolderId,
    setRenamingFolderId,
    renameFolderValue,
    setRenameFolderValue,
    newFolderName,
    setNewFolderName,
    newFolderPrefix,
    setNewFolderPrefix,
    handleCreateFolder,
    handleRenameFolder,
    handleDeleteFolder
}: AssetCentralProps) {
    return (
        <div className="flex flex-col gap-6 mb-12">
            <div className="flex items-center gap-3">
                <p className="text-[10px] font-black text-[#00B6C1] uppercase tracking-[0.3em] flex items-center gap-2">
                    <FolderOpen size={12} /> Asset Central / Folders
                </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
                {customFolders.map(folder => (
                    <div key={folder.id} className="relative group">
                        <div className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-3 ${folder.prefix === 'VB' || folder.prefix === 'P1' || folder.prefix === 'P2' || folder.prefix === 'RB' ? 'bg-white border-[#0E5858]/10 text-[#0E5858]/40' : 'bg-[#00B6C1]/5 border-[#00B6C1]/20 text-[#00B6C1]'}`}>
                            {renamingFolderId === folder.id ? (
                                <input
                                    type="text"
                                    value={renameFolderValue}
                                    onChange={e => setRenameFolderValue(e.target.value)}
                                    onBlur={() => handleRenameFolder(folder.id)}
                                    onKeyDown={e => e.key === 'Enter' && handleRenameFolder(folder.id)}
                                    className="bg-transparent outline-none border-b border-[#00B6C1] w-24"
                                    autoFocus
                                />
                            ) : (
                                <span>{folder.name} <span className="opacity-40 ml-1">({folder.prefix})</span></span>
                            )}
                        </div>
                        
                        {/* Actions on Hover - Only for custom (non-default) folders */}
                        {!(folder.prefix === 'VB' || folder.prefix === 'P1' || folder.prefix === 'P2' || folder.prefix === 'RB') && (
                            <div className="absolute -top-2 -right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all scale-75 origin-bottom-left">
                                <button onClick={() => { setRenamingFolderId(folder.id); setRenameFolderValue(folder.name); }} className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-[#0E5858] hover:text-[#00B6C1]"><Pencil size={10} /></button>
                                <button onClick={() => handleDeleteFolder(folder.id)} className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-red-500 hover:bg-red-50"><Trash2 size={10} /></button>
                            </div>
                        )}
                    </div>
                ))}

                {/* Add Folder Trigger/Input */}
                {renamingFolderId === 'new' ? (
                    <div className="flex items-center gap-3 p-2 bg-[#FAFCEE] border border-[#0E5858]/10 rounded-2xl animate-in zoom-in-95">
                        <input
                            type="text"
                            value={newFolderName}
                            onChange={e => setNewFolderName(e.target.value)}
                            placeholder="Folder Name"
                            className="bg-white border-none rounded-xl py-2 px-4 text-[10px] font-bold outline-none w-32 shadow-sm"
                        />
                        <input
                            type="text"
                            value={newFolderPrefix}
                            onChange={e => setNewFolderPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                            placeholder="PRFX"
                            maxLength={4}
                            className="bg-white border-none rounded-xl py-2 px-2 text-[10px] font-black text-[#00B6C1] outline-none w-16 shadow-sm text-center"
                        />
                        <button onClick={handleCreateFolder} className="p-2 bg-[#0E5858] text-white rounded-xl hover:bg-[#00B6C1] transition-all"><CheckCircle size={14} /></button>
                        <button onClick={() => { setRenamingFolderId(null); setNewFolderName(''); setNewFolderPrefix(''); }} className="p-2 text-gray-400 hover:text-red-500"><X size={14} /></button>
                    </div>
                ) : (
                    <button
                        onClick={() => setRenamingFolderId('new')}
                        className="flex items-center gap-2 px-6 py-3 border-2 border-dashed border-[#0E5858]/10 rounded-xl text-[10px] font-black text-[#0E5858]/30 uppercase tracking-widest hover:border-[#00B6C1] hover:text-[#00B6C1] transition-all"
                    >
                        <Plus size={14} /> Add New Category
                    </button>
                )}
            </div>
        </div>
    );
}
