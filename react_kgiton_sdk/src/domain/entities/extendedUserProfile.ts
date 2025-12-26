/**
 * Extended User Profile Entity
 * User profile stored in Huba API
 */
export interface ExtendedUserProfile {
  id?: string;
  userId: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  dateOfBirth?: Date;
  profileImageUrl?: string;
  bio?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Extended User Profile Data from API response
 */
export interface ExtendedUserProfileData {
  id?: string;
  user_id: string;
  phone_number?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  date_of_birth?: string;
  profile_image_url?: string;
  bio?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Parse ExtendedUserProfileData from API response to ExtendedUserProfile entity
 */
export function parseExtendedUserProfile(
  data: ExtendedUserProfileData
): ExtendedUserProfile {
  return {
    id: data.id,
    userId: data.user_id,
    phoneNumber: data.phone_number,
    address: data.address,
    city: data.city,
    state: data.state,
    postalCode: data.postal_code,
    country: data.country,
    dateOfBirth: data.date_of_birth
      ? new Date(data.date_of_birth)
      : undefined,
    profileImageUrl: data.profile_image_url,
    bio: data.bio,
    createdAt: data.created_at ? new Date(data.created_at) : undefined,
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
  };
}

/**
 * Update Profile Request
 */
export interface UpdateProfileRequest {
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  dateOfBirth?: Date;
  profileImageUrl?: string;
  bio?: string;
}

/**
 * Convert UpdateProfileRequest to API payload
 */
export function toUpdateProfilePayload(
  request: UpdateProfileRequest
): Record<string, string> {
  const payload: Record<string, string> = {};

  if (request.phoneNumber) payload.phone_number = request.phoneNumber;
  if (request.address) payload.address = request.address;
  if (request.city) payload.city = request.city;
  if (request.state) payload.state = request.state;
  if (request.postalCode) payload.postal_code = request.postalCode;
  if (request.country) payload.country = request.country;
  if (request.dateOfBirth)
    payload.date_of_birth = request.dateOfBirth.toISOString();
  if (request.profileImageUrl)
    payload.profile_image_url = request.profileImageUrl;
  if (request.bio) payload.bio = request.bio;

  return payload;
}
