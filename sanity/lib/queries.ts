export const chaptersQuery = `
*[_type == "benefitChapter"] | order(order asc){
  _id,
  title,
  "slug": slug.current,
  shortDescription,
  heroImage
}
`
export const chapterBySlugQuery = `
*[_type == "benefitChapter" && slug.current == $slug][0]{
  _id,
  title,
  shortDescription,
  heroImage,
  content
}
`
