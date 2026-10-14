import type { Mechanic } from '@/lib/mechanics';

/**
 * Sample shops for trying the app without a backend. Names and phone numbers are made up.
 * The same rows live in supabase/seed.sql.
 */
export const DEMO_MECHANICS: Mechanic[] = [
  { id: 'demo-01', name: 'ជាងម៉ូតូ សុខា', phone: '012000101', latitude: 11.573, longitude: 104.899, address: 'ផ្លូវ ២៧១ ទួលគោក', province: 'ភ្នំពេញ', services: ['motorbike', 'tire'], opens_at: '07:00', closes_at: '19:00', open_24h: false, is_verified: true, photo_url: null, photos: [] },
  { id: 'demo-02', name: 'ហាងជួសជុល ដារ៉ា', phone: '012000102', latitude: 11.552, longitude: 104.923, address: 'បឹងកេងកង១', province: 'ភ្នំពេញ', services: ['motorbike', 'tire'], opens_at: '06:30', closes_at: '20:00', open_24h: false, is_verified: false, photo_url: null, photos: [] },
  { id: 'demo-03', name: 'ជាងប៉ះកង់ ២៤ម៉ោង ច្បារអំពៅ', phone: '012000103', latitude: 11.544, longitude: 104.95, address: 'ផ្លូវជាតិលេខ១ ច្បារអំពៅ', province: 'ភ្នំពេញ', services: ['motorbike', 'tire'], opens_at: null, closes_at: null, open_24h: true, is_verified: true, photo_url: null, photos: [] },
  { id: 'demo-04', name: 'ជាងម៉ូតូ វិសាល សែនសុខ', phone: '012000104', latitude: 11.596, longitude: 104.88, address: 'សែនសុខ', province: 'ភ្នំពេញ', services: ['motorbike'], opens_at: '07:30', closes_at: '18:00', open_24h: false, is_verified: false, photo_url: null, photos: [] },
  { id: 'demo-05', name: 'ជាងម៉ូតូ ផ្លូវជាតិ៤ កំពង់ស្ពឺ', phone: '012000105', latitude: 11.453, longitude: 104.52, address: 'ផ្លូវជាតិលេខ៤ ក្រុងច្បារមន', province: 'កំពង់ស្ពឺ', services: ['motorbike', 'tire'], opens_at: '06:00', closes_at: '18:30', open_24h: false, is_verified: true, photo_url: null, photos: [] },
  { id: 'demo-06', name: 'ជាងប៉ះកង់ គិរីរម្យ', phone: '012000106', latitude: 11.3, longitude: 104.16, address: 'ផ្លូវជាតិលេខ៤', province: 'កំពង់ស្ពឺ', services: ['tire'], opens_at: '06:00', closes_at: '18:00', open_24h: false, is_verified: false, photo_url: null, photos: [] },
  { id: 'demo-07', name: 'ហាងជួសជុល ព្រះសីហនុ', phone: '012000107', latitude: 10.627, longitude: 103.522, address: 'ក្រុងព្រះសីហនុ', province: 'ព្រះសីហនុ', services: ['motorbike', 'tire'], opens_at: '07:00', closes_at: '21:00', open_24h: false, is_verified: true, photo_url: null, photos: [] },
  { id: 'demo-08', name: 'ជាងម៉ូតូ ស្គន់', phone: '012000108', latitude: 12.045, longitude: 104.946, address: 'ផ្លូវជាតិលេខ៦ ស្គន់', province: 'កំពង់ចាម', services: ['motorbike', 'tire'], opens_at: '06:00', closes_at: '19:00', open_24h: false, is_verified: false, photo_url: null, photos: [] },
  { id: 'demo-09', name: 'ជាងម៉ូតូ កំពង់ធំ', phone: '012000109', latitude: 12.711, longitude: 104.888, address: 'ផ្លូវជាតិលេខ៦', province: 'កំពង់ធំ', services: ['motorbike', 'tire'], opens_at: '06:30', closes_at: '18:30', open_24h: false, is_verified: true, photo_url: null, photos: [] },
  { id: 'demo-10', name: 'ហាងជួសជុល អង្គរ', phone: '012000110', latitude: 13.362, longitude: 103.86, address: 'ក្រុងសៀមរាប', province: 'សៀមរាប', services: ['motorbike', 'tire'], opens_at: '07:00', closes_at: '20:00', open_24h: false, is_verified: true, photo_url: null, photos: [] },
  { id: 'demo-11', name: 'ជាងម៉ូតូ បាត់ដំបង', phone: '012000111', latitude: 13.1, longitude: 103.2, address: 'ក្រុងបាត់ដំបង', province: 'បាត់ដំបង', services: ['motorbike'], opens_at: '07:00', closes_at: '18:00', open_24h: false, is_verified: false, photo_url: null, photos: [] },
  { id: 'demo-12', name: 'ជាងប៉ះកង់ កំពត', phone: '012000112', latitude: 10.61, longitude: 104.18, address: 'ក្រុងកំពត', province: 'កំពត', services: ['motorbike', 'tire'], opens_at: '06:30', closes_at: '19:00', open_24h: false, is_verified: false, photo_url: null, photos: [] },
  { id: 'demo-13', name: 'ជាងម៉ូតូ តាកែវ', phone: '012000113', latitude: 10.99, longitude: 104.785, address: 'ផ្លូវជាតិលេខ២', province: 'តាកែវ', services: ['motorbike', 'tire'], opens_at: '06:00', closes_at: '18:00', open_24h: false, is_verified: false, photo_url: null, photos: [] },
];
