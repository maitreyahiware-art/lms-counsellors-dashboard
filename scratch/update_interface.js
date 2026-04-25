const fs = require('fs');
const path = 'src/data/social_content_clean.ts';
let content = fs.readFileSync(path, 'utf8');

const oldInterface = `export interface CleanPost {
  id: string;
  title: string;
  category: ContentCategory;
  subType: PostSubType;
  mediaType: MediaType;
  videoUrl: string | null;
  videoType: VideoType;
  youtubeId: string | null;
  imageUrl: string | null;
  descriptionPlain: string;
  tags: string[];
  instagramUrl: string | null;
  platforms: string[];
  date: string | null;
}`;

const newInterface = `export interface CleanPost {
  id: string;
  title: string;
  category: ContentCategory;
  subType: PostSubType;
  mediaType: MediaType;
  videoUrl: string | null;
  videoType: VideoType;
  youtubeId: string | null;
  imageUrl: string | null;
  descriptionPlain: string;
  tags: string[];
  instagramUrl: string | null;
  platforms: string[];
  date: string | null;
  recipeSlug?: string;
  recipeCategorySlug?: string;
}`;

if (content.includes(oldInterface)) {
  content = content.replace(oldInterface, newInterface);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully updated interface');
} else {
  console.log('Could not find interface to replace');
}
