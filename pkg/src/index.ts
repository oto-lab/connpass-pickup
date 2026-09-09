export { ConnpassClient, type ConnpassClientOptions } from "./client.js";

export { shuffle } from "./core/shuffle.js";
export {
  buildResultMarkdown,
  renderResultHtml,
  toJson,
  toCsv,
  saveResult,
  openResult,
  type ResultFormat,
  type OpenOptions,
} from "./core/result.js";

export { getResultsDir } from "./paths.js";
export {
  getDefaultUserAgent,
  resolveUserAgent,
  type UserAgentOptions,
} from "./user-agent.js";
export { buildFetchOptions, type RequestOptions } from "./http.js";

export {
  fetchParticipants,
  fetchParticipantsDetailed,
  type Participants,
  type ParticipantRoleInfo,
  type ParticipantsDetail,
  type FetchParticipantsOptions,
} from "./participants/fetch-participants.js";

export {
  fetchEvent,
  type EventDetail,
  type EventPtype,
} from "./events/fetch-event.js";
export {
  fetchEventsBatch,
  type FetchEventsBatchOptions,
} from "./events/fetch-events-batch.js";
export {
  searchEvents,
  searchAllEvents,
  type SearchEventsParams,
  type SearchEventSummary,
  type SearchAllEventsOptions,
} from "./events/search-events.js";
export {
  fetchGroupEvents,
  type GroupEventSummary,
} from "./events/fetch-group-events.js";
export { type EventListCard } from "./events/parse-event-list-card.js";

export {
  fetchUserProfile,
  fetchUserEvents,
  type UserProfile,
  type UserEventSummary,
} from "./users/fetch-user.js";
