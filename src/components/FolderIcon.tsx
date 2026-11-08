import React from 'react';
import { Box, GitBranch, Terminal, Database, BookOpen, Folder } from 'lucide-react';

/** Icône associée à un répertoire selon son nom (Docker, Git, Linux, SQL…). */
export function FolderIcon({ name, className = 'w-5 h-5' }: { name: string; className?: string }) {
  const lower = name.toLowerCase();
  if (lower.includes('docker')) return <Box className={`${className} text-blue-500`} />;
  if (lower.includes('git')) return <GitBranch className={`${className} text-blue-500`} />;
  if (lower.includes('linux')) return <Terminal className={`${className} text-blue-400`} />;
  if (lower.includes('sql') || lower.includes('base')) return <Database className={`${className} text-blue-500`} />;
  if (lower.includes('archi') || lower.includes('déf')) return <BookOpen className={`${className} text-blue-400`} />;
  return <Folder className={`${className} text-blue-500`} />;
}
