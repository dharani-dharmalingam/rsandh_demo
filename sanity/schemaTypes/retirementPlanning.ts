import { defineType, defineField } from "sanity";

export default defineType({
    name: "retirementPlanning",
    title: "Retirement Planning Page",
    type: "document",
    fields: [
        defineField({
            name: "heroTitle",
            title: "Hero Title",
            type: "string",
        }),
        defineField({
            name: "heroDescription",
            title: "Hero Description",
            type: "text",
        }),
        defineField({
            name: "featuresTitle",
            title: "Features Section Title",
            type: "string",
        }),
        defineField({
            name: "features",
            title: "Retirement Features",
            type: "array",
            of: [
                {
                    type: "object",
                    fields: [
                        {
                            name: "iconName",
                            title: "Icon Name",
                            type: "string",
                            description: "Lucide icon name: trending-up, dollar-sign, target, bar-chart-3",
                        },
                        { name: "title", title: "Title", type: "string" },
                        { name: "description", title: "Description", type: "text" },
                    ],
                },
            ],
        }),
        defineField({
            name: "planningTitle",
            title: "Planning Section Title",
            type: "string",
        }),
        defineField({
            name: "sections",
            title: "Planning Sections",
            type: "array",
            of: [
                {
                    type: "object",
                    fields: [
                        { name: "title", title: "Title", type: "string" },
                        { name: "content", title: "Content", type: "text" },
                    ],
                },
            ],
        }),
        defineField({
            name: "ctaButtonText",
            title: "CTA Button Text",
            type: "string",
        }),
        defineField({
            name: "heroVideoUrl",
            title: "Hero Video URL",
            type: "url",
            description: "Enter a YouTube or Vimeo embed link",
        }),
        defineField({
            name: "client",
            title: "Client",
            type: "reference",
            to: [{ type: "client" }],
            weak: true,
            validation: (Rule) => Rule.required(),
        }),
    ],
});
