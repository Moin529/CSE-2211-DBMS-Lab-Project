// Trailer URL mapping for movies
// Maps movie titles to their YouTube trailer URLs

export const movieTrailerMapping = {
  'Forrest Gump': 'https://youtu.be/m-btyJIYLyI',
  'Pulp Fiction': 'https://youtu.be/tGpTpVyI_OQ',
  'Superman': 'https://www.youtube.com/watch?v=uhUht6vAsMY&t=9s',
  'Interstellar': 'https://youtu.be/LY19rHKAaAg',
  'A Minecraft Movie': 'https://youtu.be/aSh_L6bvaCQ',
  'Lilo & Stitch': 'https://youtu.be/VWqJifMMgZE',
  'The Lord of the Rings: The Fellowship of the Ring': 'https://youtu.be/CbYmZOV3G-Q',
  'The Dark Knight': 'https://youtu.be/vbjYVETxZqM',
  'Havoc': 'https://youtu.be/6txjTWLoSc8',
  'The Matrix': 'https://youtu.be/d0XTFAMmhrE',
  'The Shawshank Redemption': 'https://youtu.be/PLl99DlL6b4',
  'In the Lost Lands': 'https://youtu.be/CMyrp5Vk3mU',
  'Inception': 'https://youtu.be/cdx31ak4KbQ',
  'Until Dawn': 'https://youtu.be/xR3lVHnh0Gg',
  'Avatar 2': 'https://youtu.be/o5F8MOz_IDw'
};

// Function to get trailer URL for a movie
export const getTrailerUrl = (movieTitle) => {
  return movieTrailerMapping[movieTitle] || null;
};

// Function to check if a movie has a trailer
export const hasTrailer = (movieTitle) => {
  return movieTitle in movieTrailerMapping;
};