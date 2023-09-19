import i18n from 'i18next';
import axios from 'axios';
import * as yup from 'yup';
import _ from 'lodash';
import state from './view.js';
import resources from './locales/index.js';
import parse from './parser.js';

const urlSchema = (validatedLinks) => yup.string().required().url().notOneOf(validatedLinks);

const getUrlProxy = (url) => {
  const href = new URL('/get', 'https://allorigins.hexlet.app');
  href.searchParams.set('disableCache', 'true');
  href.searchParams.set('url', url);
  return href;
};

const typeError = (e) => {
  if (e.name === 'ParserError') {
    return 'formFeedback.errors.parserError';
  }
  if (e.isAxiosError) {
    return 'formFeedback.errors.network';
  }
  if (e.errors) {
    const [errorCode] = e.errors;
    return errorCode;
  }
  return 'formFeedback.errors.unknownError';
};
const updateRSS = (watchedState) => {
  const promises = watchedState.data.feeds.map((feed) => {
    const proxyURL = new URL(getUrlProxy(feed.url));
    return axios.get(proxyURL)
      .then((responce) => {
        const content = responce.data.contents;
        const { currentPosts } = parse(content);
        const posts = watchedState.data.posts.filter((post) => post.feedId === feed.id);
        const newPosts = _.differenceBy(currentPosts, posts, 'title');
        newPosts.forEach((newpost) => {
          const post = newpost;
          post.feedId = feed.id;
          post.id = _.uniqueId();
        });
        const initialState = { ...watchedState };
        initialState.data.posts = [...newPosts, ...watchedState.data.posts];
      })
      .catch((error) => console.log(error));
  });
  Promise.all(promises)
    .finally(() => {
      setTimeout(updateRSS, 5000, watchedState);
    });
};

export default () => {
  const i18nextInstance = i18n.createInstance();
  i18nextInstance.init({
    lng: 'ru',
    debug: true,
    resources,
  })
    .then(() => {
      const elements = {
        form: document.querySelector('.rss-form'),
        posts: document.querySelector('.posts'),
        feeds: document.querySelector('.feeds'),
        input: document.getElementById('url-input'),
        submitButton: document.querySelector('button[type="submit"]'),
        feedback: document.querySelector('.feedback'),
        modalTitle: document.querySelector('.modal-title'),
        modalDescription: document.querySelector('.modal-body'),
        modalFullArticle: document.querySelector('.full-article'),
      };

      const initialState = {
        processState: 'idle',
        form: {
          error: null,
          valid: true,
        },
        validatedLinks: [],
        uiState: {
          readPostsId: new Set(),
          modalPostId: null,
        },
        data: {
          feeds: [],
          posts: [],
        },
      };

      yup.setLocale({
        mixed: {
          notOneOf: 'formFeedback.errors.duplicateUrl',
        },
        string: {
          required: 'formFeedback.errors.emptyField',
          url: 'formFeedback.errors.invalidUrl',
        },
      });

      const watchedState = state(initialState, elements, i18nextInstance);

      elements.form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        watchedState.processState = 'loading';
        const formData = new FormData(ev.target);
        const url = formData.get('url');
        const links = watchedState.data.feeds.map((feed) => feed.url);
        urlSchema(links).validate(url)
          .then((link) => {
            const urlProx = getUrlProxy(link);
            return axios.get(urlProx);
          })
          .then((response) => response.data.contents)
          .then((content) => {
            const parsedContent = parse(content);
            const { currentFeed, currentPosts } = parsedContent;

            currentFeed.id = _.uniqueId();
            currentFeed.url = url;
            currentPosts.forEach((currentpost) => {
              const post = currentpost;
              post.feedId = currentFeed.id;
              post.id = _.uniqueId();
            });

            watchedState.data.feeds.push(currentFeed);
            watchedState.data.posts.push(...currentPosts);
            watchedState.validatedLinks.push(url);
            watchedState.processState = 'idle';
            watchedState.form = {
              error: null,
              valid: true,
            };
          })
          .catch((e) => {
            watchedState.form = {
              error: typeError(e, i18nextInstance),
              valid: false,
            };
            watchedState.processState = 'failed';
          });
      });
      elements.posts.addEventListener('click', (e) => {
        if (e.target.dataset.id) {
          const readPostsId = e.target.dataset.id;
          watchedState.uiState.modalPostId = readPostsId;
          watchedState.uiState.readPostsId.add(readPostsId);
        }
      });
      updateRSS(watchedState);
    });
};
