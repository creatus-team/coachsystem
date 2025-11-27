import axios from 'axios';

const WHATTIME_API_URL = 'https://api.whattime.co.kr/v1';
const API_KEY = process.env.WHATTIME_API_KEY;

// API 클라이언트 인스턴스 생성
const client = axios.create({
  baseURL: WHATTIME_API_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
});

export interface WhatTimeReservation {
  code: string;
  start_at: string;
  end_at: string;
  schedule?: {
    name: string;
    email: string | null;
    phone: string | null;
    status: 'confirm' | 'cancel';
  };
  product?: {
    name: string;
  };
  calendar?: {
    name: string;
  };
  // 기존 필드들은 하위 호환성을 위해 남겨두거나 제거 (API 응답에 따라)
  // name: string; // Top-level에는 없음
  // email: string; // Top-level에는 없음
}

export const whattimeApi = {
  /**
   * 내 정보 조회 (User Code 확인용)
   */
  getMe: async () => {
    try {
      const response = await client.get('/users/me');
      return response.data.resource;
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      throw error;
    }
  },

  /**
   * 예약 내역 조회
   * @param userCode 유저 코드 (예: WUg6sZeZhs)
   * @param limit 가져올 개수 (기본 100)
   */
  getReservations: async (userCode: string, limit = 100) => {
    try {
      // /schedules/recent는 최근 100개만 가져오거나 필터링이 심함.
      // /reservations 엔드포인트에 user 파라미터를 넘겨야 전체 내역 조회 가능.
      const userUri = `https://api.whattime.co.kr/v1/users/${userCode}`;
      const response = await client.get('/reservations', {
        params: {
          user: userUri,
          limit,
        },
      });
      return response.data.collection as WhatTimeReservation[];
    } catch (error) {
      console.error('Failed to fetch reservations:', error);
      throw error;
    }
  },

  /**
   * 조직 전체 예약 내역 조회
   * @param orgCode 조직 코드 (예: zjEwQyRM6a)
   * @param limit 가져올 개수
   */
  getOrganizationReservations: async (orgCode: string, limit = 100) => {
    try {
      const orgUri = `https://api.whattime.co.kr/v1/organizations/${orgCode}`;
      const response = await client.get('/reservations', {
        params: {
          organization: orgUri,
          limit,
        },
      });
      return response.data.collection as WhatTimeReservation[];
    } catch (error) {
      console.error('Failed to fetch organization reservations:', error);
      throw error;
    }
  },
};
