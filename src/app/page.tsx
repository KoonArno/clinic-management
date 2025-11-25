// src/app/page.tsx
import { redirect } from 'next/navigation';

export default function Home() {
  // ทำการ redirect ไปยังหน้า dashboard ทันที
  redirect('/dashboard');
  
  // (TS) เนื่องจาก redirect() จะ throw error
  // โค้ดส่วนนี้จึงอาจจะไม่เคยทำงาน แต่ควรมีไว้ให้ฟังก์ชันมี return
  return null; 
}