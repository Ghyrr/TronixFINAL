import { useEffect } from 'react';

interface DocumentMeta {
  title?: string;
  description?: string;
}

export function useDocumentMeta({ title, description }: DocumentMeta) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (!tag) {
        tag = document.createElement('meta');
        tag.name = 'description';
        document.head.appendChild(tag);
      }
      tag.content = description;
    }
  }, [title, description]);
}
