import React from 'react';
import type { ServerInfo } from '../../../core/types';
import { User, FileText, Briefcase, Building, Calendar, Award } from 'lucide-react';

interface ServerHeaderCardProps {
  server: ServerInfo;
  parseMethod?: 'PDF' | 'MOCK';
}

export const ServerHeaderCard: React.FC<ServerHeaderCardProps> = ({ server, parseMethod }) => {
  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-900/90 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        
        {/* Left Server Details */}
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 ring-2 ring-white/10 shrink-0">
            <User className="w-7 h-7" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-100 tracking-tight">{server.nome}</h2>
              {parseMethod === 'MOCK' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  DADOS DEMO (CENTI)
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-300">
              <span className="flex items-center text-blue-400 font-medium">
                <FileText className="w-3.5 h-3.5 mr-1" /> Matrícula: <strong className="ml-1 text-white">{server.matricula}</strong>
              </span>
              <span className="flex items-center text-slate-400">
                <Briefcase className="w-3.5 h-3.5 mr-1 text-indigo-400" /> Cargo: <strong className="ml-1 text-slate-200">{server.cargo}</strong>
              </span>
              <span className="flex items-center text-slate-400">
                <Building className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Órgão: <strong className="ml-1 text-slate-200">{server.orgao}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right Metadata Badges */}
        <div className="flex items-center space-x-3 text-xs border-t lg:border-t-0 border-slate-800 pt-3 lg:pt-0 w-full lg:w-auto justify-end">
          {server.admissao && (
            <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center space-x-1.5 text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Admissão: <strong className="text-slate-100">{server.admissao}</strong></span>
            </div>
          )}
          <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center space-x-1.5 text-blue-400 font-medium">
            <Award className="w-3.5 h-3.5" />
            <span>Progressão Funcional</span>
          </div>
        </div>

      </div>
    </div>
  );
};
