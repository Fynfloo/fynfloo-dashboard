'use client';
import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';

export type TemplateItem = {
  key: string;
  name: string;
  description: string;
  thumbnail: string;
  tags: string[];
};

export function useTemplates() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiRequest<{ templates: TemplateItem[] }>('/api/templates')
      .then((res) => setTemplates(res.templates))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return { templates, isLoading };
}
