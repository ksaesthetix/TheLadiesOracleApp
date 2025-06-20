import React, { createContext, useContext, useState } from 'react';

type WisdomArchiveContextType = {
  archive: string[];
  addToArchive: (quote: string) => void;
};

const WisdomArchiveContext = createContext<WisdomArchiveContextType>({
  archive: [],
  addToArchive: () => {},
});

export function WisdomArchiveProvider({ children }: { children: React.ReactNode }) {
  const [archive, setArchive] = useState<string[]>([]);

  const addToArchive = (quote: string) => {
    setArchive((prev) => (prev.includes(quote) ? prev : [...prev, quote]));
  };

  return (
    <WisdomArchiveContext.Provider value={{ archive, addToArchive }}>
      {children}
    </WisdomArchiveContext.Provider>
  );
}

export function useWisdomArchive() {
  return useContext(WisdomArchiveContext);
}