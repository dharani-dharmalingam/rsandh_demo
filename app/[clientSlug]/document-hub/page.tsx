import { SectionWrapper } from '@/components/section-wrapper';
import { Button } from '@/components/ui/button';
import { FileText, Download, Archive } from 'lucide-react';
import { sanityFetch } from '@/sanity/lib/live';
import { client } from '@/sanity/lib/client';
import { documentsQuery, siteSettingsQuery } from '@/sanity/lib/queries';
import { Metadata } from 'next';

export async function generateStaticParams() {
  const clients = await client.fetch<{ slug: string }[]>(
    `*[_type == "client"]{ "slug": slug.current }`
  );
  return (clients || []).map((client) => ({
    clientSlug: client.slug,
  }));
}

type Props = {
  params: Promise<{ clientSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { clientSlug } = await params
  const { data: settings } = await sanityFetch({
    query: siteSettingsQuery,
    params: { clientSlug }
  });
  const clientName = settings?.clientName || 'RS&H';
  return {
    title: `Document Hub - ${clientName} Benefits Portal`,
    description: `Download benefits documents and guides from ${clientName}`,
  }
}

type SanityDocument = {
  _id: string;
  title: string;
  fileUrl?: string;
  fileSize?: number;
  fileType?: string;
};

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileTypeLabel(mimeType?: string): string {
  if (!mimeType) return 'File';
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'DOC';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'XLS';
  return 'File';
}

export default async function DocumentHubPage({ params }: Props) {
  const { clientSlug } = await params
  const { data } = await sanityFetch({
    query: documentsQuery,
    params: { clientSlug }
  });
  const documents = (data || []) as SanityDocument[];

  return (
    <div className="space-y-0">
      {/* Hero */}
      <SectionWrapper className="bg-gradient-to-br from-blue-50 to-slate-50">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Document Hub</h1>
        <p className="text-lg text-slate-600 max-w-2xl">
          Access all important benefits documents, guides, and resources. Download what you need in PDF format.
        </p>
      </SectionWrapper>

      {/* Document List */}
      <SectionWrapper className="bg-white">
        <div className="max-w-3xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Available Documents</h2>

            {documents.length > 0 ? (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc._id}
                    className="flex items-center justify-between p-6 border border-slate-200 rounded-lg hover:shadow-md hover:border-blue-200 transition-all group"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-3 bg-slate-100 group-hover:bg-blue-50 rounded-lg transition-colors">
                        <FileText className="h-6 w-6 text-slate-600 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{doc.title}</h3>
                        <p className="text-sm text-slate-600">
                          {getFileTypeLabel(doc.fileType)}
                          {doc.fileSize ? ` • ${formatFileSize(doc.fileSize)}` : ''}
                        </p>
                      </div>
                    </div>
                    {doc.fileUrl && (
                      <Button
                        asChild
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 ml-4"
                      >
                        <a href={doc.fileUrl} download>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-600">No documents available yet. Check back soon.</p>
            )}
          </div>

          {/* Quick Categories */}
          <div className="mt-12 pt-8 border-t border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Browse by Category</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 border border-slate-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex items-start gap-4">
                  <Archive className="h-6 w-6 text-blue-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Plan Documents</h3>
                    <p className="text-sm text-slate-600">
                      Detailed plan summaries, SPDs, and coverage documents
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 border border-slate-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex items-start gap-4">
                  <Archive className="h-6 w-6 text-blue-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Enrollment Materials</h3>
                    <p className="text-sm text-slate-600">
                      Open enrollment guides and enrollment instructions
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 border border-slate-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex items-start gap-4">
                  <Archive className="h-6 w-6 text-blue-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Compliance Notices</h3>
                    <p className="text-sm text-slate-600">
                      Annual notices, privacy notices, and compliance documents
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 border border-slate-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex items-start gap-4">
                  <Archive className="h-6 w-6 text-blue-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Forms</h3>
                    <p className="text-sm text-slate-600">
                      Enrollment forms, beneficiary forms, and claims forms
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Help Section */}
      <SectionWrapper className="bg-slate-50">
        <div className="max-w-3xl p-8 bg-white rounded-lg border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Can't Find What You're Looking For?</h2>
          <p className="text-slate-600 mb-6">
            Our Benefits Assistant can help you locate documents or answer questions about our benefits. Use the chat
            button in the bottom right corner to get started.
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700">Contact Support</Button>
        </div>
      </SectionWrapper>
    </div>
  );
}
