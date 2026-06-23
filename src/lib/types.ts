/**
 * Core domain types for the UP Media Monitoring Dashboard.
 */

export type MediaType = "YouTube" | "X" | "Online";

export type PrintSourceType = "constituency" | "district" | "mp" | "mla";

export type Sentiment = "Positive" | "Negative" | "Neutral";

/** Political entity a mention can be linked to (derived from the Keyword column). */
export type RepType = "MLA" | "Lok Sabha MP" | "Rajya Sabha MP";

/** Parsed JSON array columns stored as TEXT in news_* tables. */
export interface NewsArrayFields {
  /** District names parsed from the `District` JSON array column. */
  districts: string[];
  /** Constituency names from the `Constituency` JSON array column. */
  constituencies: string[];
  /** MLA names from the `MLA` JSON array column. */
  mla: string[];
  /** Lok Sabha MP names from the `Loksabha_MP` JSON array column. */
  loksabhaMp: string[];
  /** Rajya Sabha MP names from the `Rajyasabha_MP` JSON array column. */
  rajyasabhaMp: string[];
}

export type NewsMediaKind = "Print" | "YouTube" | "X" | "Online";

/** Shared fields from `news_youtube`, `news_x`, and `news_online` tables. */
export interface DigitalNewsRecordBase extends NewsArrayFields {
  id: string;
  mediaType: MediaType;
  headline: string;
  summary: string | null;
  content: string;
  ccm: string | null;
  language: string;
  sentiment: Sentiment;
  authors: string;
  /** ISO date string (yyyy-MM-dd) derived from `CreatedAt`. */
  date: string | null;
  /** Original timestamp in ms (for sorting / trend). */
  timestamp: number | null;
  link: string | null;
  /** Primary district (first entry in `districts`). */
  district: string;
  /** Primary constituency (first entry in `constituencies`). */
  constituency: string;
}

/** Combined digital record returned when querying all media types. */
export type MediaRecord = YouTubeRecord | XRecord | OnlineRecord;

export interface SentimentBreakdown {
  positive: number;
  negative: number;
  neutral: number;
}

export interface MediaBreakdown {
  print: number;
  youtube: number;
  x: number;
  online: number;
}

export interface DistrictSummary {
  district: string;
  dt_name: string;
  /** Matching GeoJSON district name (for the map). */
  geoName: string;
  total: number;
  print: number;
  youtube: number;
  x: number;
  online: number;
  positive: number;
  negative: number;
  neutral: number;
}

export interface TrendPoint {
  date: string;
  total: number;
  print: number;
  youtube: number;
  x: number;
  online: number;
}

export interface NameCount {
  name: string;
  count: number;
}

/** A single ranked news item (used by the Top Positive / Negative charts). */
export interface NewsItem {
  id: string;
  headline: string;
  link: string;
  mediaType: MediaType;
  district: string;
  sentiment: Sentiment;
  date: string | null;
}

export interface DashboardResponse {
  totalNews: number;
  printCount: number;
  youtubeCount: number;
  xCount: number;
  onlineCount: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  districtSummary: DistrictSummary[];
  topDistricts: NameCount[];
  topPositiveNews: NewsItem[];
  topNegativeNews: NewsItem[];
  mediaDistribution: MediaBreakdown;
  dailyTrend: TrendPoint[];
  topProfiles: NameCount[];
  topChannels: NameCount[];
  languageDistribution: NameCount[];
  dateRange: { min: string | null; max: string | null };
  lastUpdated: string;
}

export interface DistrictAnalyticsResponse {
  district: string;
  total: number;
  sentiment: SentimentBreakdown;
  media: MediaBreakdown;
  mediaSentiment: {
    print: SentimentBreakdown;
    youtube: SentimentBreakdown;
    x: SentimentBreakdown;
    online: SentimentBreakdown;
  };
  dailyTrend: TrendPoint[];
  topProfiles: NameCount[];
  languageDistribution: NameCount[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalPages: number;
}

export interface MediaQueryResponse {
  district: string | null;
  constituency: string | null;
  mediaType: MediaType | "All";
  total: number;
  records: MediaRecord[];
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface PrintRecord extends NewsArrayFields {
  id: string;
  sourceType: PrintSourceType;
  scope: string;
  srNo: number | null;
  headline: string;
  summary: string | null;
  content: string;
  publication: string;
  author: string;
  edition: string;
  pageNo: string | number | null;
  sentiment: Sentiment;
  ccm: string | null;
  language: string;
  date: string | null;
  timestamp: number | null;
}

/** YouTube row from `news_youtube`. */
export interface YouTubeRecord extends DigitalNewsRecordBase {
  mediaType: "YouTube";
  channel: string | null;
  duration: string | null;
  commentCount: string | null;
  likeCount: string | null;
}

/** X/Twitter row from `news_x`. */
export interface XRecord extends DigitalNewsRecordBase {
  mediaType: "X";
  handles: string | null;
  engagement: string | null;
  engagements: string | null;
}

/** Online/web row from `news_online`. */
export interface OnlineRecord extends DigitalNewsRecordBase {
  mediaType: "Online";
  website: string | null;
}

export interface TypedNewsQueryResponse<T, K extends NewsMediaKind> {
  mediaType: K;
  district: string | null;
  constituency: string | null;
  entity: string | null;
  total: number;
  records: T[];
  page?: number;
  limit?: number;
  totalPages?: number;
}

export type YouTubeQueryResponse = TypedNewsQueryResponse<YouTubeRecord, "YouTube">;
export type XQueryResponse = TypedNewsQueryResponse<XRecord, "X">;
export type OnlineQueryResponse = TypedNewsQueryResponse<OnlineRecord, "Online">;
export type PrintQueryResponse = TypedNewsQueryResponse<PrintRecord, "Print">;

export interface ConstituencyPrintResponse {
  constituency: string | null;
  total: number;
  records: PrintRecord[];
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface ConstituencyAnalyticsResponse {
  constituency: string;
  total: number;
  printTotal: number;
  sentiment: SentimentBreakdown;
  media: MediaBreakdown;
  mediaSentiment: {
    print: SentimentBreakdown;
    youtube: SentimentBreakdown;
    x: SentimentBreakdown;
    online: SentimentBreakdown;
  };
  dailyTrend: TrendPoint[];
  topProfiles: NameCount[];
  languageDistribution: NameCount[];
}

export interface ConstituencyElectionResult {
  year: number;
  winnerName: string | null;
  winnerParty: string | null;
  totalCandidates: number | null;
  totalVotesPolled: number | null;
  exitPollResult: string | null;
}

export interface ConstituencyPartyOrg {
  jiladhyaksha: string | null;
  mahanagar: string | null;
  mandal: string | null;
  jilapratinidhi: string | null;
  boothadhyaksha: string | null;
}

export interface ConstituencyCasteSegment {
  label: string;
  percentage: number | null;
}

export interface ConstituencyInsight {
  label: string;
  value: string;
}

export interface ConstituencyDetailResponse {
  srNo: number | null;
  constituencyName: string;
  personAllottedTo: string | null;
  reservationStatus: string | null;
  assemblySegments: string[];
  totalPopulation: number | null;
  caste: {
    mostPopulated: ConstituencyCasteSegment | null;
    secondMajority: ConstituencyCasteSegment | null;
    rest: ConstituencyCasteSegment[];
  };
  elections: ConstituencyElectionResult[];
  insights: ConstituencyInsight[];
  partyOrganization: {
    bjp: ConstituencyPartyOrg;
    sp: ConstituencyPartyOrg;
    bsp: ConstituencyPartyOrg;
    inc: ConstituencyPartyOrg;
  };
}

/** Profile fields from `UP Government Member Data.xlsx`. */
export interface GovernmentMemberProfile {
  name: string;
  currentEmployment: string | null;
  highestQualification: string | null;
}

export interface CareerPosition {
  period: string;
  position: string;
}

/** MP bio fields from Lok Sabha / Rajya Sabha JSON files. */
export interface MPBioProfile {
  fullName: string;
  constituency: string | null;
  partyFname: string | null;
  dateOfBirth: string | null;
  education: string | null;
  profession: string | null;
  careerTimeline: CareerPosition[];
}

export type House = "Lok Sabha" | "Rajya Sabha";

/** Minimal fields for MLA directory list / selector. */
export interface MLAListItem {
  id: string;
  name: string;
  constituency: string | null;
  party: string | null;
}

/** Minimal fields for MP directory list / selector. */
export interface MPListItem {
  id: string;
  name: string;
  house: House;
  constituency: string | null;
  party: string | null;
}

export interface MLA {
  id: string;
  name: string;
  /** Bio details from Vidhan Sabha JSON when matched. */
  bioProfile: MPBioProfile | null;
  /** Government member details when matched in UP Government Member Data. */
  governmentProfile: GovernmentMemberProfile | null;
  /** Derived from linked news mentions; null when unavailable. */
  district: string | null;
  constituency: string | null;
  party: string | null;
  designation: string;
  email: string | null;
  phone: string | null;
  image: string | null;
  education: string | null;
  age: number | null;
  gender: string | null;
  bio: string | null;
  socialMedia: {
    twitter: string | null;
    facebook: string | null;
    instagram: string | null;
    website: string | null;
  } | null;
  performanceScore: number | null;
  attendance: number | null;
  publicEngagement: number | null;
  mediaMentions: number;
  /** Total real engagement (likes + comments + shares) across linked mentions. */
  totalEngagement: number;
  /** Media-wise count (YouTube / X / Online) of linked mentions. */
  media: MediaBreakdown;
  sentiment: SentimentBreakdown;
}

/** Member of Parliament — same shape as an MLA plus the house of Parliament. */
export interface MP {
  id: string;
  name: string;
  /** Bio details from Lok Sabha / Rajya Sabha JSON when matched. */
  bioProfile: MPBioProfile | null;
  house: House;
  houses: House[];
  constituency: string | null;
  /** Derived from linked news mentions; null when unavailable. */
  district: string | null;
  party: string | null;
  designation: string;
  email: string | null;
  phone: string | null;
  image: string | null;
  education: string | null;
  age: number | null;
  gender: string | null;
  bio: string | null;
  termSince: number | null;
  socialMedia: {
    twitter: string | null;
    facebook: string | null;
    instagram: string | null;
    website: string | null;
  } | null;
  performanceScore: number | null;
  attendance: number | null;
  publicEngagement: number | null;
  mediaMentions: number;
  /** Total real engagement (likes + comments + shares) across linked mentions. */
  totalEngagement: number;
  /** Media-wise count (YouTube / X / Online) of linked mentions. */
  media: MediaBreakdown;
  sentiment: SentimentBreakdown;
}

export type SortDirection = "asc" | "desc";

export type ConstituencyScope = "parliamentary" | "legislative";

/** Shared filter params used across the API. */
export interface GlobalFilters {
  district?: string | null;
  constituency?: string | null;
  /** Parliamentary (LK_Constituency) vs legislative assembly (Constituency). */
  constituencyScope?: ConstituencyScope | null;
  mediaType?: MediaType | "All" | null;
  sentiment?: Sentiment | "All" | null;
  language?: string | null;
  search?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  /** Filter to a specific linked person (exact match on entityName). */
  entity?: string | null;
  /** Limits print to a specific folder (district / MLA / MP). */
  printSource?: "district" | "mla" | "mp" | null;
  /** Column id for server-side table sort. */
  sortBy?: string | null;
  sortDir?: SortDirection | null;
}

export const MEDIA_TYPES: MediaType[] = ["YouTube", "X", "Online"];
export const SENTIMENTS: Sentiment[] = ["Positive", "Negative", "Neutral"];
