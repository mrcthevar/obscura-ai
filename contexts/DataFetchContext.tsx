import React, { createContext, useContext, useState } from 'react';

interface DataFetchContextType {
  isFetching: boolean;
  fetchStatus: string | null;
  setFetchState: (isFetching: boolean, status?: string) => void;
}

export const DataFetchContext = createContext<DataFetchContextType>({
  isFetching: false,
  fetchStatus: null,
  setFetchState: () => {}
});

export const DataFetchProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isFetching, setIsFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<string | null>(null);

  const setFetchState = (fetching: boolean, status: string = 'Accessing Neural Archives...') => {
    setIsFetching(fetching);
    setFetchStatus(fetching ? status : null);
  };

  return (
    <DataFetchContext.Provider value={{ isFetching, fetchStatus, setFetchState }}>
      {children}
    </DataFetchContext.Provider>
  );
};

export const useDataFetch = () => useContext(DataFetchContext);