'use client';

import { useQuery, useMutation, gql } from '@apollo/client';
import { useUserData } from '@nhost/react';

// --- GraphQL Queries ---
export const GET_CLUBS = gql`
  query GetClubs {
    clubs {
      id
      name
      slug
      category
      description
      logo_url
      club_members {
        id
      }
    }
  }
`;

export const GET_CLUB_DETAILS = gql`
  query GetClubDetails($id: uuid!) {
    clubs_by_pk(id: $id) {
      id
      name
      category
      description
      logo_url
      club_members {
        id
        role
        user {
          id
          displayName
          avatarUrl
        }
      }
      club_events(order_by: {event_date: asc}) {
        id
        title
        description
        event_date
        image_url
      }
    }
  }
`;

export const GET_MY_MANAGED_CLUBS = gql`
  query MyManagedClubs($userId: uuid!) {
    club_members(where: {user_id: {_eq: $userId}, role: {_eq: "manager"}}) {
      club {
        id
        name
        category
        description
        logo_url
        club_members {
          id
          role
          joined_at
          user {
            id
            displayName
            email
            avatarUrl
          }
        }
        club_events(order_by: {event_date: asc}) {
          id
          title
          description
          event_date
          image_url
          created_by
        }
      }
    }
  }
`;

export const GET_CLUB_MEMBERS = gql`
  query GetClubMembers($clubId: uuid!) {
    club_members(where: {club_id: {_eq: $clubId}}) {
      id
      role
      user_id
      joined_at
      user {
        id
        displayName
        email
        avatarUrl
      }
    }
  }
`;

export const GET_CLUB_EVENTS = gql`
  query GetClubEvents($clubId: uuid!) {
    club_events(where: {club_id: {_eq: $clubId}}, order_by: {event_date: asc}) {
      id
      title
      description
      event_date
      image_url
      created_by
    }
  }
`;

export const GET_CLUB_BY_EMAIL = gql`
  query GetClubByEmail($email: String!) {
    clubs(where: {club_email: {_eq: $email}}) {
      id
      name
      slug
      category
      description
      logo_url
      banner_url
      club_email
    }
  }
`;

export const GET_CLUB_BY_SLUG = gql`
  query GetClubBySlug($slug: String!) {
    clubs(where: {slug: {_eq: $slug}}) {
      id
      name
      slug
      category
      description
      logo_url
      banner_url
      club_email
      club_members {
        id
        role
        user {
          id
          displayName
          email
          avatarUrl
        }
      }
      club_events(order_by: {event_date: asc}) {
        id
        title
        description
        event_date
        image_url
        created_by
      }
    }
  }
`;

// --- GraphQL Mutations ---
export const UPDATE_CLUB_PROFILE = gql`
  mutation UpdateClubProfile($id: uuid!, $name: String!, $description: String, $logo_url: String) {
    update_clubs_by_pk(
      pk_columns: {id: $id},
      _set: {
        name: $name,
        description: $description,
        logo_url: $logo_url
      }
    ) {
      id
      name
    }
  }
`;

export const INSERT_CLUB = gql`
  mutation InsertClub($name: String!, $slug: String!, $description: String, $logo_url: String, $club_email: String!) {
    insert_clubs_one(object: {
      name: $name,
      slug: $slug,
      description: $description,
      logo_url: $logo_url,
      club_email: $club_email
    }) {
      id
    }
  }
`;

export const INSERT_CLUB_EVENT = gql`
  mutation InsertClubEvent($club_id: uuid!, $title: String!, $description: String, $event_date: timestamptz!, $image_url: String) {
    insert_club_events_one(object: {
      club_id: $club_id,
      title: $title,
      description: $description,
      event_date: $event_date,
      image_url: $image_url
    }) {
      id
    }
  }
`;

export const DELETE_CLUB_EVENT = gql`
  mutation DeleteClubEvent($id: uuid!) {
    delete_club_events_by_pk(id: $id) {
      id
    }
  }
`;

export const UPDATE_CLUB_EVENT = gql`
  mutation UpdateClubEvent($id: uuid!, $title: String!, $description: String, $event_date: timestamptz!, $image_url: String) {
    update_club_events_by_pk(
      pk_columns: {id: $id},
      _set: {
        title: $title,
        description: $description,
        event_date: $event_date,
        image_url: $image_url
      }
    ) {
      id
    }
  }
`;

export const INSERT_CLUB_MEMBER = gql`
  mutation InsertClubMember($club_id: uuid!, $user_id: uuid!, $role: String!) {
    insert_club_members_one(object: {
      club_id: $club_id,
      user_id: $user_id,
      role: $role
    }) {
      id
    }
  }
`;

export const UPDATE_CLUB_MEMBER_ROLE = gql`
  mutation UpdateClubMemberRole($id: uuid!, $role: String!) {
    update_club_members_by_pk(
      pk_columns: {id: $id},
      _set: {role: $role}
    ) {
      id
      role
    }
  }
`;

export const DELETE_CLUB_MEMBER = gql`
  mutation DeleteClubMember($id: uuid!) {
    delete_club_members_by_pk(id: $id) {
      id
    }
  }
`;

export function useClubData() {
    const user = useUserData();
    const userId = user?.id;
    const userEmail = user?.email;

    // Get basic list of all clubs
    const { data: clubsData, loading: clubsLoading, refetch: refetchClubs } = useQuery(GET_CLUBS);

    // Get clubs managed by the current user
    const { data: managedClubsData, loading: managedClubsLoading, refetch: refetchManagedClubs } = useQuery(GET_MY_MANAGED_CLUBS, {
        variables: { userId },
        skip: !userId
    });

    // Get club managed by current user email
    const { data: myClubByEmailData, loading: myClubByEmailLoading, refetch: refetchMyClubByEmail } = useQuery(GET_CLUB_BY_EMAIL, {
        variables: { email: userEmail },
        skip: !userEmail
    });

    return {
        clubs: clubsData?.clubs || [],
        clubsLoading,
        refetchClubs,
        
        managedClubs: managedClubsData?.club_members?.map((cm: any) => cm.club) || [],
        managedClubsLoading,
        refetchManagedClubs,

        myClubByEmail: myClubByEmailData?.clubs?.[0] || null,
        myClubByEmailLoading,
        refetchMyClubByEmail,
        
        // Export mutation definitions to be used by components directly to manage their own loading/error states
        GET_CLUB_BY_SLUG,
        INSERT_CLUB,
        UPDATE_CLUB_PROFILE,
        INSERT_CLUB_EVENT,
        UPDATE_CLUB_EVENT,
        DELETE_CLUB_EVENT,
        INSERT_CLUB_MEMBER,
        UPDATE_CLUB_MEMBER_ROLE,
        DELETE_CLUB_MEMBER,
        GET_CLUB_MEMBERS,
        GET_CLUB_EVENTS,
        GET_CLUB_DETAILS,
        GET_CLUB_BY_EMAIL
    };
}
