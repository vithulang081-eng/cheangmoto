-- Demo shops (made-up names and numbers) so the app has something to show. Same rows as src/lib/demo-mechanics.ts.
-- services: 'motorbike' (ជាងម៉ូតូ) and/or 'tire' (ជាងកង់).
insert into public.mechanics (name, phone, location, address, province, services, opens_at, closes_at, open_24h, is_verified, status) values
  ('ជាងម៉ូតូ សុខា', '012000101', 'SRID=4326;POINT(104.899 11.573)', 'ផ្លូវ ២៧១ ទួលគោក', 'ភ្នំពេញ', '{motorbike,tire}', '07:00', '19:00', false, true, 'approved'),
  ('ហាងជួសជុល ដារ៉ា', '012000102', 'SRID=4326;POINT(104.923 11.552)', 'បឹងកេងកង១', 'ភ្នំពេញ', '{motorbike,tire}', '06:30', '20:00', false, false, 'approved'),
  ('ជាងប៉ះកង់ ២៤ម៉ោង ច្បារអំពៅ', '012000103', 'SRID=4326;POINT(104.95 11.544)', 'ផ្លូវជាតិលេខ១ ច្បារអំពៅ', 'ភ្នំពេញ', '{motorbike,tire}', null, null, true, true, 'approved'),
  ('ជាងម៉ូតូ វិសាល សែនសុខ', '012000104', 'SRID=4326;POINT(104.88 11.596)', 'សែនសុខ', 'ភ្នំពេញ', '{motorbike}', '07:30', '18:00', false, false, 'approved'),
  ('ជាងម៉ូតូ ផ្លូវជាតិ៤ កំពង់ស្ពឺ', '012000105', 'SRID=4326;POINT(104.52 11.453)', 'ផ្លូវជាតិលេខ៤ ក្រុងច្បារមន', 'កំពង់ស្ពឺ', '{motorbike,tire}', '06:00', '18:30', false, true, 'approved'),
  ('ជាងប៉ះកង់ គិរីរម្យ', '012000106', 'SRID=4326;POINT(104.16 11.3)', 'ផ្លូវជាតិលេខ៤', 'កំពង់ស្ពឺ', '{tire}', '06:00', '18:00', false, false, 'approved'),
  ('ហាងជួសជុល ព្រះសីហនុ', '012000107', 'SRID=4326;POINT(103.522 10.627)', 'ក្រុងព្រះសីហនុ', 'ព្រះសីហនុ', '{motorbike,tire}', '07:00', '21:00', false, true, 'approved'),
  ('ជាងម៉ូតូ ស្គន់', '012000108', 'SRID=4326;POINT(104.946 12.045)', 'ផ្លូវជាតិលេខ៦ ស្គន់', 'កំពង់ចាម', '{motorbike,tire}', '06:00', '19:00', false, false, 'approved'),
  ('ជាងម៉ូតូ កំពង់ធំ', '012000109', 'SRID=4326;POINT(104.888 12.711)', 'ផ្លូវជាតិលេខ៦', 'កំពង់ធំ', '{motorbike,tire}', '06:30', '18:30', false, true, 'approved'),
  ('ហាងជួសជុល អង្គរ', '012000110', 'SRID=4326;POINT(103.86 13.362)', 'ក្រុងសៀមរាប', 'សៀមរាប', '{motorbike,tire}', '07:00', '20:00', false, true, 'approved'),
  ('ជាងម៉ូតូ បាត់ដំបង', '012000111', 'SRID=4326;POINT(103.2 13.1)', 'ក្រុងបាត់ដំបង', 'បាត់ដំបង', '{motorbike}', '07:00', '18:00', false, false, 'approved'),
  ('ជាងប៉ះកង់ កំពត', '012000112', 'SRID=4326;POINT(104.18 10.61)', 'ក្រុងកំពត', 'កំពត', '{motorbike,tire}', '06:30', '19:00', false, false, 'approved'),
  ('ជាងម៉ូតូ តាកែវ', '012000113', 'SRID=4326;POINT(104.785 10.99)', 'ផ្លូវជាតិលេខ២', 'តាកែវ', '{motorbike,tire}', '06:00', '18:00', false, false, 'approved');
