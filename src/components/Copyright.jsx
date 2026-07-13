import React from 'react';

export default function Copyright() {
  return (
    <p className="text-xs text-muted-foreground text-center mt-10 pb-4">
      © {new Date().getFullYear()}{' '}
      <a
        href="https://orcid.org/my-orcid?orcid=0000-0003-2718-6848"
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        Scott Thomas Stone
      </a>
    </p>
  );
}