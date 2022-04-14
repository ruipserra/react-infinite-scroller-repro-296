import { useCallback, useState, useEffect } from 'react';
import { BrowserRouter, Link, Routes, Route, useParams } from "react-router-dom";
import InfiniteScroll from 'react-infinite-scroller';
import parseLinkHeader from 'parse-link-header';

import logo from './logo.svg';
import './App.css';

async function fetchIssue(url) {
  const response = await fetch(url, {
    method: 'GET',
    headers: new Headers({
      Accept: 'application/vnd.github.v3+json'
    })
  });

  const json = await response.json();

  return json;
}

async function fetchIssues(url) {
  const response = await fetch(url, {
    method: 'GET',
    headers: new Headers({
      Accept: 'application/vnd.github.v3+json'
    })
  });

  const links = parseLinkHeader(response.headers.get('Link'));
  const issues = await response.json();

  return {
    links,
    issues
  };
}

function IssuesPage() {
  const [items, setItems] = useState([]);
  const [nextPageUrl, setNextPageUrl] = useState(
    'https://api.github.com/repos/facebook/react/issues'
  );
  const [fetching, setFetching] = useState(false);

  const fetchItems = useCallback(
    async () => {
      if (fetching) {
        return;
      }

      setFetching(true);

      try {
        const { issues, links } = await fetchIssues(nextPageUrl);

        setItems([...items, ...issues]);

        if (links.next) {
          setNextPageUrl(links.next.url);
        } else {
          setNextPageUrl(null);
        }
      } finally {
        setFetching(false);
      }
    },
    [items, fetching, nextPageUrl]
  );

  const hasMoreItems = !!nextPageUrl;

  const loader = (
    <div key="loader" className="loader">
      Loading ...
    </div>
  );

  return (
    <InfiniteScroll
      loadMore={fetchItems}
      hasMore={hasMoreItems}
      loader={loader}
    >
      <ul>
        {items.map(item => (
          <li key={item.number}>
            <Link to={`/issue/${item.number}`}>{item.title}</Link>
          </li>
        ))}
      </ul>
    </InfiniteScroll>
  );
}

function IssuePage() {
  const params = useParams();
  const issueId = params.issueId;

  const [issue, setIssue] = useState({});

  useEffect(() => {
    const init = async () => {
      const issue = await fetchIssue(`https://api.github.com/repos/facebook/react/issues/${issueId}`);
      setIssue(issue);
    };

    init()
  }, [issueId]);

  return (
    <>
      <h2>Issue details (#{issueId})</h2>
      <pre>
        {JSON.stringify(issue, null, 2)}
      </pre>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IssuesPage />} />
        <Route path="/issue/:issueId" element={<IssuePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
