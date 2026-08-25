"use client";

import * as React from "react";
import type { Locale } from "@sfrankey/shared";
import { Button, ConfirmDialog } from "@sfrankey/ui";
import { clearPreferences } from "@/lib/storage";

export function ClearLocalData({ label, locale = "vi" }: { label: string; locale?: Locale }) {
  const [open, setOpen] = React.useState(false);

  const title = locale === "vi" ? "Xác nhận xóa dữ liệu cục bộ?" : "Clear local preferences?";
  const description =
    locale === "vi"
      ? "Thao tác này sẽ xóa toàn bộ cài đặt giao diện, ngôn ngữ, danh sách yêu thích và lịch sử công cụ đã mở trên trình duyệt của bạn."
      : "This will reset all theme preferences, language, favorites and recently used tools stored in your browser.";
  const note =
    locale === "vi"
      ? "Trang web sẽ tự động tải lại sau khi dữ liệu được làm mới."
      : "The page will automatically reload once local data is reset.";
  const confirmLabel = locale === "vi" ? "Xóa ngay" : "Clear now";
  const cancelLabel = locale === "vi" ? "Hủy bỏ" : "Cancel";

  return (
    <>
      <Button type="button" variant="danger" onClick={() => setOpen(true)}>
        {label}
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        tone="danger"
        title={title}
        description={description}
        note={note}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        onConfirm={() => {
          clearPreferences();
          window.location.reload();
        }}
      />
    </>
  );
}
