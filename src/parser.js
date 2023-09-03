const getFeed = (document) => {
  const titleEl = document.querySelector('channel > title');
  const descriptionEl = document.querySelector('channel > description');

  if (!titleEl || !descriptionEl) {
    return null;
  }

  const title = titleEl.textContent;
  const description = descriptionEl.textContent;
  return { title, description };
};

const getPosts = (document) => {
  const itemEls = document.querySelectorAll('channel > item');

  if (!itemEls) {
    return null;
  }

  const posts = Array.from(itemEls)
    .map((item) => {
      const titleEl = item.querySelector('title');
      const descriptionEl = item.querySelector('description');
      const guidEl = item.querySelector('guid');
      const linkEl = item.querySelector('link');

      const title = titleEl.textContent;
      const description = descriptionEl.textContent;
      const link = linkEl.textContent;
      const guid = guidEl.textContent;

      return {
        title, description, link, guid,
      };
    });
  return posts;
};

export default (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'text/xml');
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) {
    const error = new Error(errorNode.textContent);
    error.isParseError = true;
    throw error;
  }
  const currentFeed = getFeed(doc);
  const currentPosts = getPosts(doc);
  return { currentFeed, currentPosts };
};
