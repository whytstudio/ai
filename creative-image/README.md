# Creative Image projects

Each project has its own folder of images. To add a project, create a folder here (for example, `new-brand/`) and place its `.webp`, `.png`, `.jpg`, `.jpeg`, or `.avif` files inside. Then run `npm run build:creative-images` from the website root. The build refreshes `projects.js` and `projects.json`; the page loads `projects.js` so it also works when opened directly in Chrome. No page edits are needed.

The original images in the top-level `Creative Image/` folders are also supported. The same build converts them into numbered WebP files here while retaining their full dimensions.
