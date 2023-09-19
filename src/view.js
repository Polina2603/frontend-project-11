import onChange from 'on-change';

const handleFormProcess = (initialState, elements, i18nextInstance) => {
  const { input, feedback } = elements;
  const { form: { error, valid } } = initialState;
  if (valid) {
    feedback.textContent = i18nextInstance.t('formFeedback.success');
    input.classList.remove('is-invalid');
    feedback.classList.remove('text-danger');
    feedback.classList.add('text-success');
  } else {
    feedback.textContent = i18nextInstance.t(error);
    input.classList.add('is-invalid');
    feedback.classList.remove('text-success');
    feedback.classList.add('text-danger');
  }
};

const handleProcess = (elements, processState) => {
  const { form, input, submitButton } = elements;

  switch (processState) {
    case 'loading':
      input.setAttribute('readonly', 'true');
      submitButton.disabled = true;
      break;
    case 'idle':
      form.reset();
      input.focus();
      submitButton.disabled = false;
      input.removeAttribute('readonly');
      break;

    case 'failed':
      submitButton.disabled = false;
      input.removeAttribute('readonly');
      break;

    default:
      throw new Error(`Unknown process state: ${processState}`);
  }
};

const renderFeeds = (elements, value, i18nextInstance) => {
  const { feeds } = elements;
  const div1 = document.createElement('div');
  div1.classList.add('card', 'border-0');

  const div2 = document.createElement('div');
  div2.classList.add('card-body');

  const h2 = document.createElement('h2');
  h2.classList.add('card-title', 'h4');
  h2.textContent = i18nextInstance.t('feeds');

  const ul = document.createElement('ul');
  ul.classList.add('list-group', 'border-0', 'rounded-0');

  value.forEach((feed) => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'border-0', 'border-end-0');

    const h3 = document.createElement('h3');
    h3.classList.add('h6', 'm-0');
    h3.textContent = feed.title;

    const p = document.createElement('p');
    p.classList.add('m-0', 'small', 'text-black-50');
    p.textContent = feed.description;

    li.append(h3, p);
    ul.append(li);
  });

  div2.append(h2);
  div1.append(div2, ul);
  feeds.textContent = '';
  feeds.append(div1);
};

const renderPosts = (elements, value, i18nextInstance) => {
  const { posts } = elements;

  const div1 = document.createElement('div');
  div1.classList.add('card', 'border-0');

  const div2 = document.createElement('div');
  div2.classList.add('card-body');

  const h2 = document.createElement('h2');
  h2.classList.add('card-title', 'h4');
  h2.textContent = i18nextInstance.t('posts');

  const ul = document.createElement('ul');
  ul.classList.add('list-group', 'border-0', 'rounded-0');

  value.forEach((post) => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');

    const a = document.createElement('a');
    a.setAttribute('href', post.link);
    a.classList.add('fw-bold');
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
    a.textContent = post.title;
    a.dataset.id = post.id;

    const btn = document.createElement('button');
    btn.setAttribute('type', 'button');
    btn.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    btn.dataset.id = post.id;
    btn.dataset.bsToggle = 'modal';
    btn.dataset.bsTarget = '#modal';
    btn.textContent = i18nextInstance.t('view');

    ul.append(li);
    li.append(a, btn);
  });

  div2.append(h2);
  div1.append(div2, ul);
  posts.innerHTML = '';
  posts.append(div1);
};

const setLinkReadPost = (readPostsId) => {
  const anchors = document.querySelectorAll('.posts ul .list-group-item a');
  anchors.forEach((a) => {
    if (readPostsId.has(a.dataset.id)) {
      a.classList.remove('fw-bold');
      a.classList.add('fw-normal', 'link-secondary');
    }
  });
};

const renderModal = (elements, value, initialState) => {
  const { modalTitle, modalDescription, modalFullArticle } = elements;
  const { data: { posts } } = initialState;
  const clickedPost = posts.find((post) => post.id === value);
  modalTitle.textContent = clickedPost.title;
  modalDescription.textContent = clickedPost.description;
  modalFullArticle.setAttribute('href', clickedPost.link);
};

export default (initialState, elements, i18nextInstance) => {
  const watchedState = onChange(initialState, (path, value) => {
    switch (path) {
      case 'processState':
        handleProcess(elements, value);
        break;

      case 'data.feeds':
        renderFeeds(elements, value, i18nextInstance);
        break;

      case 'data.posts':
        renderPosts(elements, value, i18nextInstance);
        setLinkReadPost(initialState.uiState.readPostsId);
        break;

      case 'uiState.readPostsId':
        setLinkReadPost(value);
        break;

      case 'validatedLinks':
        break;

      case 'uiState.modalPostId':
        renderModal(elements, value, initialState);
        break;

      case 'form':
        handleFormProcess(initialState, elements, i18nextInstance);
        break;

      default:
        throw new Error('Unknown error');
    }
  });
  return watchedState;
};
