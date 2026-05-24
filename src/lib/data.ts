export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration: string;
  cover: string;
  category: 'Journey' | 'Progression' | 'Emotions' | 'Symphonica';
}

export const TRACKS: Track[] = [
  {
    id: '1',
    title: 'Journey 2024 (Uplifting Mix)',
    artist: 'DJX',
    url: 'https://soundcloud.com/danieldjx/journey-2024-uplifting-mix',
    duration: '1:20:00',
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800',
    category: 'Journey',
  },
  {
    id: '2',
    title: 'Progression Vol. 45',
    artist: 'DJX',
    url: 'https://soundcloud.com/danieldjx/progression-vol-45',
    duration: '58:30',
    cover: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=800',
    category: 'Progression',
  },
  {
    id: '3',
    title: 'Emotions - Deep Trance',
    artist: 'DJX',
    url: 'https://soundcloud.com/danieldjx/emotions-deep-trance',
    duration: '1:05:00',
    cover: 'https://images.unsplash.com/photo-1514525253344-991422a79a67?auto=format&fit=crop&q=80&w=800',
    category: 'Emotions',
  },
  {
    id: '4',
    title: 'Symphonica (Orchestral Trance)',
    artist: 'DJX',
    url: 'https://soundcloud.com/danieldjx/symphonica-orchestral',
    duration: '1:12:00',
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800',
    category: 'Symphonica',
  },
  {
    id: '5',
    title: 'Journey 2023 Yearmix',
    artist: 'DJX',
    url: 'https://soundcloud.com/danieldjx/journey-2023-yearmix',
    duration: '2:30:00',
    cover: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=800',
    category: 'Journey',
  },
  {
    id: '6',
    title: 'Journey 2022 Yearmix',
    artist: 'DJX',
    url: 'https://soundcloud.com/danieldjx/journey-2022-yearmix',
    duration: '2:15:00',
    cover: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
    category: 'Journey',
  },
  {
    id: '7',
    title: 'Progression Vol. 44',
    artist: 'DJX',
    url: 'https://soundcloud.com/danieldjx/progression-vol-44',
    duration: '1:02:00',
    cover: 'https://images.unsplash.com/photo-1496293455970-f8581aae0e3c?auto=format&fit=crop&q=80&w=800',
    category: 'Progression',
  }
];
