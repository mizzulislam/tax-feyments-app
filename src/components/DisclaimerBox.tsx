import React from 'react';

export function DisclaimerBox() {
  return (
    <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 my-4 rounded-r-lg">
      <p className="font-bold text-yellow-800 text-sm">⚠️ Perhatian Penting</p>
      <p className="text-yellow-700 text-sm mt-1">
        Hasil kalkulasi ini adalah <strong>estimasi</strong> dan bukan angka pajak resmi. 
        Angka aktual dapat berbeda tergantung kondisi dan kebijakan perpajakan terbaru. 
        Selalu verifikasi dengan konsultan pajak bersertifikat (BKP) atau langsung 
        melalui sistem resmi DJP di{" "}
        <a href="https://pajak.go.id" target="_blank" rel="noopener noreferrer" 
           className="underline font-semibold">
          pajak.go.id
        </a>.
      </p>
    </div>
  );
}
