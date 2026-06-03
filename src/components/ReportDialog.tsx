import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import type { Role } from "@/lib/mock-data";
import { createReport } from "@/lib/client-api";
import { getSessionUser } from "@/lib/session";

export function ReportDialog({
  targetRole,
  targetPhoneOrEmail,
  onClose,
}: {
  targetRole: "donor" | "hospital";
  targetPhoneOrEmail: string;
  onClose: () => void;
}) {
  const session = getSessionUser();
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reporterRole = (session?.role ?? "donor") as Role;
  const reporterId = session?.phone ?? session?.email ?? "";

  const submit = async () => {
    if (description.trim().length < 10) {
      toast.error("Please add a short description (min 10 chars)");
      return;
    }
    setSubmitting(true);
    try {
      await createReport({
        data: {
          reporterRole,
          reporterPhoneOrEmail: reporterId,
          targetRole,
          targetPhoneOrEmail,
          description,
        },
      });
      toast.success("Report submitted");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
      <div className="w-full max-w-md border border-border bg-surface hud-shadow">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <div className="font-mono text-[10px] tracking-widest uppercase text-primary">
              // Report
            </div>
            <h2 className="text-lg font-bold">Report {targetRole}</h2>
            <div className="font-mono text-xs text-muted-foreground">{targetPhoneOrEmail}</div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        <div className="p-5 flex flex-col gap-3">
          <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
            Description
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full border border-border bg-background px-3 py-2.5 font-mono text-sm outline-none focus:border-primary"
            placeholder="Explain what happened..."
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-border p-5">
          <button
            onClick={onClose}
            className="border border-border px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="bg-primary px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-primary-foreground hover:bg-foreground disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
