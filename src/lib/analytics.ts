import mixpanel from 'mixpanel-browser';

export const initAnalytics = () => {
  const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  
  if (MIXPANEL_TOKEN) {
    mixpanel.init(MIXPANEL_TOKEN, {
      debug: process.env.NODE_ENV === 'development',
      track_pageview: true,
      persistence: 'localStorage',
    });
  }
};

export const analytics = {
  track: (eventName: string, properties?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'production') {
      mixpanel.track(eventName, properties);
    } else {
      console.log('Analytics Event:', eventName, properties);
    }
  },
  identify: (userId: string) => {
    if (process.env.NODE_ENV === 'production') {
      mixpanel.identify(userId);
    } else {
      console.log('Analytics Identify:', userId);
    }
  },
};
