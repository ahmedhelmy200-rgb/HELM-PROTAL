import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ScanText, X } from "lucide-react";
import PageHeader from "../components/helm/PageHeader";
import EmptyState from "../components/helm/EmptyState";
import { FileText } from "lucide-react";
import CaseFolderView from "../components/documents/CaseFolderView";
import DocCard from "../components/documents/DocCard";
import DocFormDialog from "../components/documents/DocFormDialog";
import { useAuth } from "@/lib/AuthContext";
import { searchInFields } from "@/lib/search";
import PaginationControls from "@/components/shared/PaginationControls";
import { PageErrorState } from "@/components/app/AppStatusBar";
import { usePageRefresh } from "@/hooks/usePageRefresh";
import { APP_SHORTCUT_NEW, APP_SHORTCUT_SEARCH, subscribeAppEvent } from "@/lib/app-events";

const FOLDER_MAP = {
  "صحيفة دعوى": "صحيفة دعوى",
  "مذكرة": "مذكرات",
  "حكم": "أحكام",
  "عقد": "عقود وتوكيلات",
  "توكيل": "عقود وتوكيلات",
  "شهادة": "شهادات",
  "مستند رسمي": "مستندات رسمية",
  "أخرى": "أخرى",
};

function getDocFolder(doc) {
  return doc.folder || FOLDER_MAP[doc.doc_type] || "أخرى";
}

export default function Documents() {
  const { user } = useAuth();
  const isClient = user?.role === "client";
  const [docs, setDocs] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [ocrSearch, setOcrSearch] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 12;
  const searchRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [{ data: d, total: totalDocs }, c] = await Promise.all([
        base44.entities.Document.listPage("-created_date", { page, pageSize }),
        base44.entities.Case.list( "title", 300)
      ]);
      setDocs(d);
      setCases(c);
      setTotal(totalDocs);
    } catch (error) {
      setLoadError(error.message || 'تعذر تحميل المستندات.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadData(); }, [loadData]);
  usePageRefresh(loadData, ['documents', 'cases']);

  useEffect(() => {
    const offNew    = subscribeAppEvent(APP_SHORTCUT_NEW,    ({ page: p }) => p === 'Documents' && openCreate());
    const offSearch = subscribeAppEvent(APP_SHORTCUT_SEARCH, ({ page: p }) => p === 'Documents' && searchRef.current?.focus());
    return () => { offNew(); offSearch(); };
  }, []);

  const openCreate = () => { setEditing(null); setShowDialog(true); };
  const openEdit = (d) => { setEditing(d); setShowDialog(true); };

  const handleSelectCase = (caseId) => {
    setSelectedCase(prev => prev === caseId ? null : caseId);
    setSelectedFolder(null);
  };

  const filteredDocs = docs.filter(doc => {
    if (selectedCase === "__unlinked__") {
      if (doc.case_id) return false;
    } else if (selectedCase) {
      if (doc.case_id !== selectedCase) return false;
    }
    if (selectedFolder && getDocFolder(doc) !== selectedFolder) return false;
    if (search) {
      const inFields = searchInFields(doc, ['title', 'case_title', 'client_name', 'file_name'], search);
      const inOcr = ocrSearch && searchInFields(doc, ['ocr_text'], search);
      if (!inFields && !inOcr) return false;
    }
    return true;
  });

  const ocrMatchCount = search && ocrSearch
    ? filteredDocs.filter(d => searchInFields(d, ['ocr_text'], search)).length
    : 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title={isClient ? "مستنداتي" : "أرشيف المستندات"}
        subtitle={`${total || docs.length} مستند${isClient ? " خاص بك" : ''}`}
        action={
          <Button onClick={openCreate} className="bg-primary text-white gap-2">
            <Plus className="h-4 w-4" />{isClient ? "رفع مستند" : "إضافة مستند"}
          </Button>
        }
      />

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchRef}
            placeholder={ocrSearch ? "بحث داخل نصوص المستندات (OCR)..." : "بحث بالاسم أو القضية..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-10"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
        <Button
          variant={ocrSearch ? "default" : "outline"}
          size="sm"
          className={`gap-2 ${ocrSearch ? "bg-primary text-white" : ""}`}
          onClick={() => setOcrSearch(v => !v)}
        >
          <ScanText className="h-4 w-4" />
          بحث OCR
          {ocrSearch && <Badge className="bg-white/20 text-white text-[10px] mr-1">فعّال</Badge>}
        </Button>
      </div>

      {ocrSearch && search && ocrMatchCount > 0 && (
        <div className="px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-sm text-primary flex items-center gap-2">
          <ScanText className="h-4 w-4" />
          تم العثور على <strong>{ocrMatchCount}</strong> مستند يحتوي على "<strong>{search}</strong>" في نص المستند
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : loadError ? (
        <PageErrorState message={loadError} onRetry={loadData} />
      ) : (
        <div className="flex gap-5">
          <div className="hidden md:flex flex-col w-56 shrink-0">
            <div className="bg-card rounded-xl border border-border p-3 sticky top-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">مجلدات القضايا</p>
              <CaseFolderView
                cases={cases}
                docs={docs}
                selectedCase={selectedCase}
                selectedFolder={selectedFolder}
                onSelectCase={handleSelectCase}
                onSelectFolder={setSelectedFolder}
                onSelectDoc={openEdit}
              />
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-4">
            {(selectedCase || selectedFolder) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                <button onClick={() => { setSelectedCase(null); setSelectedFolder(null); }} className="text-primary hover:underline">
                  كل المستندات
                </button>
                {selectedCase && selectedCase !== "__unlinked__" && (
                  <>
                    <span>/</span>
                    <span className="text-foreground font-medium">{cases.find(c => c.id === selectedCase)?.title || "قضية"}</span>
                  </>
                )}
                {selectedFolder && <><span>/</span><span className="text-foreground font-medium">{selectedFolder}</span></>}
                <Badge variant="secondary" className="text-xs mr-2">{filteredDocs.length} مستند</Badge>
              </div>
            )}

            {filteredDocs.length === 0 ? (
              <EmptyState icon={FileText} title="لا توجد مستندات" description={search ? "لم يُعثر على نتائج للبحث" : "أضف مستندات وستظهر هنا منظمة حسب القضايا"} action={<Button onClick={openCreate}>إضافة مستند</Button>} />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3">
                  {filteredDocs.map(doc => (
                    <DocCard key={doc.id} doc={doc} onEdit={openEdit} searchQuery={ocrSearch ? search : ""} />
                  ))}
                </div>
                <PaginationControls page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
              </>
            )}
          </div>
        </div>
      )}

      <DocFormDialog open={showDialog} onOpenChange={setShowDialog} editing={editing} cases={cases} onSaved={() => { setShowDialog(false); loadData(); }} />
    </div>
  );
}
