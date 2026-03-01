import { getTopicBySlug as getTopicBySlugFromRepo, listTopics as listTopicsFromRepo } from '@/lib/topics-repo';

interface TopicFilters {
  macroArea?: string;
  subTopic?: string;
  difficulty?: string;
  incidence?: string;
  limit?: string;
}

export async function listTopics(filters: TopicFilters = {}) {
  return listTopicsFromRepo(filters);
}

export async function getTopicBySlug(slug: string) {
  return getTopicBySlugFromRepo(slug);
}
