import { defineLive } from "next-sanity/live";
import { client } from './client'
import { activeClientSlug } from '../env'

const token = process.env.SANITY_API_READ_TOKEN;

const { sanityFetch: remoteFetch, SanityLive } = defineLive({
  client,
  serverToken: token,
  browserToken: token,
});

export { SanityLive };

export const sanityFetch: typeof remoteFetch = (args) => {
  const clientSlug = (args.params as any)?.clientSlug || activeClientSlug;
  return remoteFetch({
    ...args,
    params: {
      ...args.params,
      clientSlug,
    },
  });
};
