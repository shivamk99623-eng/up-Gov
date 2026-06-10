/**
 * Core domain types for the UP Media Monitoring Dashboard.
 */

export type MediaType = "YouTube" | "X" | "Online";

export type PrintSourceType = "constituency" | "district" | "mp" | "mla";

export type Sentiment = "Positive" | "Negative" | "Neutral";

/** Political entity a mention can be linked to (derived from the Keyword column). */
export type RepType = "MLA" | "Lok Sabha MP" | "Rajya Sabha MP";

/** A single normalized media mention record. */
export interface MediaRecord {
  id: string;
  mediaType: MediaType;
  /** Original raw channel value (Youtube / Twitter / Web / Reddit). */
  rawChannel: string;
  category: string | null;
  profile: string | null;
  profileVisits: number | null;
  profileUsers: number | null;
  language: string;
  followersRank: number | null;
  totalEngagement: number;
  totalEngagementWithViews: number;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  impressions: number;
  /** ISO date string (yyyy-MM-dd) */
  date: string | null;
  /** Original timestamp in ms (for sorting / trend). */
  timestamp: number | null;
  sentiment: Sentiment;
  headline: string;
  content: string;
  country: string | null;
  location: string | null;
  tracker: string | null;
  district: string;
  /** Lok Sabha constituency (from Excel column or Keyword tags). */
  constituency: string;
  keyword: string;
  url: string;
  /** Linked person name (from Keyword), or null for general state/district news. */
  entityName: string | null;
  /** Linked person type, or null for general news. */
  entityType: RepType | null;
}

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
  url: string;
  mediaType: MediaType;
  district: string;
  sentiment: Sentiment;
  engagement: number;
  views: number;
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

export interface MediaQueryResponse {
  district: string | null;
  constituency: string | null;
  mediaType: MediaType | "All";
  total: number;
  records: MediaRecord[];
}

export interface PrintRecord {
  id: string;
  sourceType: PrintSourceType;
  scope: string;
  srNo: number | null;
  headline: string;
  publication: string;
  author: string;
  edition: string;
  pageNo: string | number | null;
  sentiment: Sentiment;
  ccm: string | null;
  language: string;
  date: string | null;
}

export interface PrintQueryResponse {
  district: string | null;
  constituency: string | null;
  entity: string | null;
  total: number;
  records: PrintRecord[];
}

export interface ConstituencyPrintResponse {
  constituency: string | null;
  total: number;
  records: PrintRecord[];
}

export interface ConstituencyAnalyticsResponse {
  constituency: string;
  total: number;
  printTotal: number;
  sentiment: SentimentBreakdown;
  media: MediaBreakdown;
  mediaSentiment: {
    youtube: SentimentBreakdown;
    x: SentimentBreakdown;
    online: SentimentBreakdown;
  };
  dailyTrend: TrendPoint[];
  topProfiles: NameCount[];
  languageDistribution: NameCount[];
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

export interface MLA {
  id: string;
  name: string;
  /** Government member details when matched in UP Government Member Data. */
  governmentProfile: GovernmentMemberProfile | null;
  district: string;
  constituency: string;
  party: string;
  designation: string;
  email: string;
  phone: string;
  image: string;
  education: string;
  age: number;
  gender: string;
  bio: string;
  socialMedia: {
    twitter: string;
    facebook: string;
    instagram: string;
    website: string;
  };
  performanceScore: number;
  attendance: number;
  publicEngagement: number;
  mediaMentions: number;
  /** Total real engagement (likes + comments + shares) across linked mentions. */
  totalEngagement: number;
  /** Media-wise count (YouTube / X / Online) of linked mentions. */
  media: MediaBreakdown;
  sentiment: SentimentBreakdown;
}

export type House = "Lok Sabha" | "Rajya Sabha";

/** Member of Parliament — same shape as an MLA plus the house of Parliament. */
export interface MP {
  id: string;
  name: string;
  /** Bio details from Lok Sabha / Rajya Sabha JSON when matched. */
  bioProfile: MPBioProfile | null;
  /** Primary house for display (from media-data when available). */
  house: House;
  /** All houses this MP is linked to across media-data and print folders. */
  houses: House[];
  /** Lok Sabha constituency, or state representation for Rajya Sabha. */
  constituency: string;
  district: string;
  party: string;
  designation: string;
  email: string;
  phone: string;
  image: string;
  education: string;
  age: number;
  gender: string;
  bio: string;
  /** Year first elected / nominated to the current term. */
  termSince: number;
  socialMedia: {
    twitter: string;
    facebook: string;
    instagram: string;
    website: string;
  };
  performanceScore: number;
  attendance: number;
  publicEngagement: number;
  mediaMentions: number;
  /** Total real engagement (likes + comments + shares) across linked mentions. */
  totalEngagement: number;
  /** Media-wise count (YouTube / X / Online) of linked mentions. */
  media: MediaBreakdown;
  sentiment: SentimentBreakdown;
}

/** Shared filter params used across the API. */
export interface GlobalFilters {
  district?: string | null;
  constituency?: string | null;
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
}

export const MEDIA_TYPES: MediaType[] = ["YouTube", "X", "Online"];
export const SENTIMENTS: Sentiment[] = ["Positive", "Negative", "Neutral"];
