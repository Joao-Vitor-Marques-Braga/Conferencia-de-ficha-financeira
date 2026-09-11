import React from 'react';
import type { ServerInfo } from '../../../core/types';
import { User, FileText, Briefcase, Building, Calendar, Award } from 'lucide-react';

interface ServerHeaderCardProps {
  server: ServerInfo;
  parseMethod?: 'PDF' | 'MOCK';
}

export const ServerHeaderCard: React.FC<ServerHeaderCardProps> = ({ server }) => {
  return (
    <div className="solid-card rounded-2xl p-5 shadow-xs transition-colors">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">

        {/* Left Server Details */}
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-[#1e3a5f] dark:bg-[#324f72] flex items-center justify-center text-white shadow-xs shrink-0 transition-colors">
            <User className="w-7 h-7" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">{server.nome}</h2>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1.5 text-xs text-slate-600 dark:text-slate-300 transition-colors">
              <span className="flex items-center text-amber-700 dark:text-[#ead04d] font-bold">
                <FileText className="w-3.5 h-3.5 mr-1 text-amber-700 dark:text-[#ead04d]" /> Matrícula: <strong className="ml-1 text-slate-900 dark:text-white font-extrabold">{server.matricula}</strong>
              </span>
              <span className="flex items-center text-slate-600 dark:text-slate-300">
                <Briefcase className="w-3.5 h-3.5 mr-1 text-[#ea580c] dark:text-[#f88543]" /> Cargo: <strong className="ml-1 text-slate-800 dark:text-slate-100 font-bold">{server.cargo}</strong>
              </span>
              <span className="flex items-center text-slate-600 dark:text-slate-300">
                <Building className="w-3.5 h-3.5 mr-1 text-[#008d50]" /> Órgão: <strong className="ml-1 text-slate-800 dark:text-slate-100 font-bold">{server.orgao}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right Metadata Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs border-t lg:border-t-0 border-slate-200 dark:border-[#324f72]/40 pt-3 lg:pt-0 w-full lg:w-auto justify-end">
          {server.portariaNumero && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-[#ead04d]/15 border border-amber-300 dark:border-[#ead04d]/40 flex items-center space-x-1.5 text-amber-800 dark:text-[#ead04d] font-black transition-colors">
              <span>{server.portariaNumero}</span>
            </div>
          )}
          {server.admissao && (
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1b2a3f] border border-slate-200 dark:border-[#324f72] flex items-center space-x-1.5 text-slate-700 dark:text-slate-200 transition-colors">
              <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-[#ead04d]" />
              <span>Admissão: <strong className="text-slate-900 dark:text-white font-bold">{server.admissao}</strong></span>
            </div>
          )}
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-[#008d50]/20 border border-emerald-300 dark:border-[#008d50]/30 flex items-center space-x-1.5 text-emerald-800 dark:text-[#008d50] font-black transition-colors">
            <Award className="w-3.5 h-3.5 text-[#008d50]" />
            <span>Progressão Funcional</span>
          </div>
        </div>

      </div>
    </div>
  );
};
