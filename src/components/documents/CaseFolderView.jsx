import React from "react";
import { Folder, FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const FOLDERS = ["صحيفة دعوى", "مذكرات", "أحكام", "عقود وتوكيلات", "شهادات", "مستندات رسمية", "أخرى"];

export default function CaseFolderView({ cases, docs, selectedCase, selectedFolder, onSelectCase, onSelectFolder }) {
  const getDocsForCase = (caseId) => docs.filter(d => d.case_id === caseId);
  const getDocsForFolder = (caseId, folder) => docs.filter(d => d.case_id === caseId && (d.folder || mapDocTypeToFolder(d.doc_type)) === folder);

  const mapDocTypeToFolder = (docType) => {
    const map = {
      "صحيفة دعوى": "صحيفة دعوى",
      "مذكرة": "مذكرات",
      "حكم": "أحكام",
      "عقد": "عقود وتوكيلات",
      "توكيل": "عقود وتوكيلات",
      "شهادة": "شهادات",
      "مستند رسمي": "مستندات رسمية",
      "أخرى": "أخرى",
    };
    return map[docType] || "أخرى";
  };

  const unlinkedDocs = docs.filter(d => !d.case_id);

  return (
    <div className="h-full flex flex-col gap-1 overflow-y-auto">
      <button
        onClick={() => onSelectCase("__unlinked__")}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all w-full text-right",
          selectedCase === "__unlinked__" ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
        )}
      >
        <Folder className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">غير مرتبطة بقضية</span>
        {unlinkedDocs.length > 0 && <Badge variant="secondary" className="text-xs">{unlinkedDocs.length}</Badge>}
      </button>

      {cases.map(c => {
        const caseDocs = getDocsForCase(c.id);
        const isOpen = selectedCase === c.id;
        return (
          <div key={c.id}>
            <button
              onClick={() => onSelectCase(isOpen ? null : c.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all w-full text-right",
                isOpen ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
              )}
            >
              {isOpen ? <FolderOpen className="h-4 w-4 shrink-0 text-accent" /> : <Folder className="h-4 w-4 shrink-0 text-primary/70" />}
              <span className="flex-1 truncate text-xs">{c.title}</span>
              {caseDocs.length > 0 && <Badge variant="secondary" className="text-xs">{caseDocs.length}</Badge>}
            </button>

            {isOpen && (
              <div className="mr-4 border-r-2 border-border pr-2 mt-1 mb-1 space-y-0.5">
                {FOLDERS.map(folder => {
                  const folderDocs = getDocsForFolder(c.id, folder);
                  if (folderDocs.length === 0 && selectedFolder !== folder) return null;
                  return (
                    <button
                      key={folder}
                      onClick={() => onSelectFolder(selectedFolder === folder ? null : folder)}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs w-full text-right transition-all",
                        selectedFolder === folder ? "bg-secondary text-secondary-foreground font-medium" : "hover:bg-muted text-muted-foreground"
                      )}
                    >
                      <Folder className="h-3.5 w-3.5 shrink-0" />
                      <span className="flex-1 truncate">{folder}</span>
                      {folderDocs.length > 0 && <span className="text-[10px] text-muted-foreground">{folderDocs.length}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
