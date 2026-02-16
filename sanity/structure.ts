import type { StructureResolver } from 'sanity/structure'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Multi-Client Content')
    .items([
      // 1. Clients at the top level
      S.listItem()
        .title('Clients')
        .child(
          S.documentTypeList('client')
            .title('Select Client')
            .child(clientId =>
              S.list()
                .title('Client Content')
                .items([
                  // Site Settings for this client
                  S.listItem()
                    .title('Site branding & Settings')
                    .child(
                      S.documentList()
                        .title('Settings')
                        .filter('_type == "siteSettings" && client._ref == $clientId')
                        .params({ clientId })
                    ),

                  S.divider(),

                  // Benefit Chapters for this client
                  S.listItem()
                    .title('Benefit Chapters')
                    .child(
                      S.documentList()
                        .title('Chapters')
                        .filter('_type == "benefitChapter" && client._ref == $clientId')
                        .params({ clientId })
                    ),

                  // Page Sections for this client
                  S.listItem()
                    .title('Page Content')
                    .child(
                      S.list()
                        .title('Pages')
                        .items([
                          S.listItem()
                            .title('Hero / Enrollment Settings')
                            .child(
                              S.documentList()
                                .title('Enrollment')
                                .filter('_type == "openEnrollment" && client._ref == $clientId')
                                .params({ clientId })
                            ),
                          S.listItem()
                            .title('Retirement Planning Page')
                            .child(
                              S.documentList()
                                .title('Retirement')
                                .filter('_type == "retirementPlanning" && client._ref == $clientId')
                                .params({ clientId })
                            ),
                          S.listItem()
                            .title('Enrollment Checklist Page')
                            .child(
                              S.documentList()
                                .title('Checklist')
                                .filter('_type == "enrollmentChecklist" && client._ref == $clientId')
                                .params({ clientId })
                            ),
                          S.listItem()
                            .title('Benefit Changes Page')
                            .child(
                              S.documentList()
                                .title('Changes')
                                .filter('_type == "benefitChangesPage" && client._ref == $clientId')
                                .params({ clientId })
                            ),
                        ])
                    ),

                  // Documents for this client
                  S.listItem()
                    .title('Document Hub')
                    .child(
                      S.documentList()
                        .title('Documents')
                        .filter('_type == "documentHub" && client._ref == $clientId')
                        .params({ clientId })
                    ),
                ])
            )
        ),

      S.divider(),

      // Allow seeing all documents for admin purposes
      S.listItem()
        .title('All Content (Admin)')
        .child(
          S.list()
            .title('All Documents')
            .items(S.documentTypeListItems())
        )
    ])
