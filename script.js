const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#primary-nav');

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
    navigation.classList.toggle('is-open', !isOpen);
  });

  navigation.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open navigation');
      navigation.classList.remove('is-open');
    });
  });
}

const filterButtons = [...document.querySelectorAll('.filter-button')];
const projectCards = [...document.querySelectorAll('.project-card')];
filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    projectCards.forEach((card) => {
      const categories = card.dataset.category.split(' ');
      card.hidden = filter !== 'all' && !categories.includes(filter);
    });
  });
});

const projectDetails = {
  vantara: {
    eyebrow: '01 / MACHINE LEARNING',
    title: 'Vantara — Customer Behavior Platform',
    summary: 'A retail analytics platform that turns transaction history into customer-level behavior signals and interactive insights.',
    steps: ['Prepare customer and transaction data for modeling.', 'Build behavioral features and explore churn and purchase patterns.', 'Serve predictions through a FastAPI layer and an interactive dashboard.'],
    tags: ['Python', 'Machine Learning', 'FastAPI', 'Streamlit'],
    repo: 'https://github.com/Ish596/vantara-platform',
    demo: 'https://vantara-platform-eg5kzm6eyygkva35viiby3.streamlit.app/'
  },
  recruitment: {
    eyebrow: '02 / AI + AUTOMATION',
    title: 'Recruitment Screening Workflow',
    summary: 'An n8n prototype for organizing initial resume screening, with a human reviewer kept in the decision loop.',
    steps: ['Collect an application and store its PDF resume.', 'Use Gemini to extract and summarize profile details against a job description.', 'Score and route the result into review categories; a person makes the hiring decision.'],
    tags: ['n8n', 'Google Gemini', 'Python', 'Drive', 'Sheets', 'Gmail'],
    repo: 'https://github.com/Ish596/HR---Recruitment-Automation-System-'
  },
  email: {
    eyebrow: '03 / GENERATIVE AI',
    title: 'AI Email Assistant',
    summary: 'An email workflow that summarizes new messages and drafts replies, then waits for approval before anything is sent.',
    steps: ['Watch Gmail for incoming unread mail.', 'Ask Gemini for a concise summary, reply decision, and suggested response.', 'Save a draft and request approval in Telegram; send only after approval.'],
    tags: ['n8n', 'Gemini', 'Gmail API', 'Telegram', 'JavaScript', 'JSON'],
    repo: 'https://github.com/Ish596/AI-Gmail-managing-automation-'
  },
  sales: {
    eyebrow: '04 / BUSINESS AUTOMATION',
    title: 'Sales Lead Qualification',
    summary: 'A workflow that gathers lead information, checks and enriches it, then creates a simple qualification score and follow-up record.',
    steps: ['Collect lead and company details from a form.', 'Verify email and enrich customer data across connected services.', 'Score and classify the lead, then create reports and notifications.'],
    tags: ['n8n', 'Hunter.io', 'Airtable', 'Google Sheets', 'Gmail', 'Slack'],
    repo: 'https://github.com/Ish596/-sales-lead-automation'
  },
  opsflow: {
    eyebrow: '05 / WORKFLOW COLLECTION',
    title: 'OpsFlow Automation',
    summary: 'A growing collection of n8n experiments focused on moving and cleaning information between everyday tools.',
    steps: ['Bring together inputs from connected sheets.', 'Transform and route records with conditional logic.', 'Remove duplicates, group results, and send the right updates.'],
    tags: ['n8n', 'Google Sheets', 'Gmail', 'Slack', 'Data transformation'],
    repo: 'https://github.com/Ish596/Opsflow-automation'
  }
};

const caseDialog = document.querySelector('#case-dialog');
const caseTitle = document.querySelector('#case-title');
const caseEyebrow = document.querySelector('#case-eyebrow');
const caseSummary = document.querySelector('#case-summary');
const caseSteps = document.querySelector('#case-steps');
const caseTags = document.querySelector('#case-tags');
const caseLinks = document.querySelector('#case-links');

function addDialogLink(label, href, extraClass = '') {
  const link = document.createElement('a');
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.className = extraClass;
  link.textContent = label + ' ↗';
  caseLinks.append(link);
}

function openCaseStudy(id) {
  const project = projectDetails[id];
  if (!project || !caseDialog) return;
  caseEyebrow.textContent = project.eyebrow;
  caseTitle.textContent = project.title;
  caseSummary.textContent = project.summary;
  caseSteps.replaceChildren(...project.steps.map((step) => {
    const item = document.createElement('li');
    item.textContent = step;
    return item;
  }));
  caseTags.replaceChildren(...project.tags.map((tag) => {
    const item = document.createElement('span');
    item.textContent = tag;
    return item;
  }));
  caseLinks.replaceChildren();
  addDialogLink('View source on GitHub', project.repo);
  if (project.demo) addDialogLink('Open live dashboard', project.demo, 'live-link');
  caseDialog.showModal();
}

document.querySelectorAll('[data-open-case]').forEach((button) => {
  button.addEventListener('click', () => openCaseStudy(button.dataset.openCase));
});
document.querySelector('.dialog-close')?.addEventListener('click', () => caseDialog.close());
caseDialog?.addEventListener('click', (event) => {
  if (event.target === caseDialog) caseDialog.close();
});

const runButton = document.querySelector('#run-workflow');
const workflowStatus = document.querySelector('#workflow-status');
if (runButton && workflowStatus) {
  const scenarios = {
    email: {
      nodes: [
        ['EMAIL TRIGGER', 'unread inbox message'],
        ['AI SUMMARY', 'Gemini reads the message'],
        ['HUMAN APPROVAL', 'draft waits for review']
      ],
      steps: ['1/3 · READING THE INBOX', '2/3 · SUMMARIZING WITH GEMINI', '3/3 · PREPARING A REPLY'],
      done: 'DONE · WAITING FOR HUMAN APPROVAL'
    },
    recruitment: {
      nodes: [
        ['RESUME UPLOAD', 'new applicant PDF'],
        ['PROFILE MATCH', 'skills vs. job criteria'],
        ['REVIEW QUEUE', 'person makes the decision']
      ],
      steps: ['1/3 · EXTRACTING RESUME DETAILS', '2/3 · MATCHING ROLE SKILLS', '3/3 · SENDING FOR REVIEW'],
      done: 'DONE · HUMAN HIRING REVIEW'
    },
    sales: {
      nodes: [
        ['LEAD CAPTURE', 'new website enquiry'],
        ['AI QUALIFICATION', 'company fit + score'],
        ['CRM ROUTING', 'notify the sales owner']
      ],
      steps: ['1/3 · CHECKING NEW LEAD', '2/3 · SCORING COMPANY FIT', '3/3 · ROUTING TO THE CRM'],
      done: 'DONE · SALES OWNER NOTIFIED'
    }
  };
  const scenarioButtons = [...document.querySelectorAll('.scenario-button')];
  const nodeCards = [document.querySelector('.flow-input'), document.querySelector('.flow-model'), document.querySelector('.flow-output')];
  const connectors = [document.querySelector('.line-one'), document.querySelector('.line-two')];
  const nodeTitles = [document.querySelector('#flow-input-title'), document.querySelector('#flow-model-title'), document.querySelector('#flow-output-title')];
  const nodeDetails = [document.querySelector('#flow-input-detail'), document.querySelector('#flow-model-detail'), document.querySelector('#flow-output-detail')];
  let selectedScenario = 'email';

  function chooseScenario(name) {
    if (!scenarios[name]) return;
    selectedScenario = name;
    scenarios[name].nodes.forEach(([title, detail], index) => {
      nodeTitles[index].textContent = title;
      nodeDetails[index].textContent = detail;
    });
    scenarioButtons.forEach((button) => {
      const active = button.dataset.scenario === name;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    nodeCards.forEach((node) => node.classList.remove('is-active', 'is-done'));
    connectors.forEach((line) => line.classList.remove('is-lit'));
    workflowStatus.textContent = 'LOCAL DEMO · READY';
    runButton.innerHTML = '<span class="play-icon" aria-hidden="true">▶</span> Run sample';
  }

  scenarioButtons.forEach((button) => {
    button.addEventListener('click', () => chooseScenario(button.dataset.scenario));
  });

  runButton.addEventListener('click', async () => {
    const scenario = scenarios[selectedScenario];
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 180 : 720;
    runButton.disabled = true;
    runButton.innerHTML = '<span class="play-icon" aria-hidden="true">◌</span> Running';
    scenarioButtons.forEach((button) => { button.disabled = true; });
    nodeCards.forEach((node) => node.classList.remove('is-active', 'is-done'));
    connectors.forEach((line) => line.classList.remove('is-lit'));
    for (let index = 0; index < nodeCards.length; index += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, delay));
      if (index > 0) {
        nodeCards[index - 1].classList.remove('is-active');
        nodeCards[index - 1].classList.add('is-done');
        connectors[index - 1].classList.add('is-lit');
      }
      nodeCards[index].classList.add('is-active');
      workflowStatus.textContent = scenario.steps[index];
    }
    await new Promise((resolve) => window.setTimeout(resolve, delay));
    nodeCards[2].classList.remove('is-active');
    nodeCards[2].classList.add('is-done');
    workflowStatus.textContent = scenario.done;
    runButton.disabled = false;
    scenarioButtons.forEach((button) => { button.disabled = false; });
    runButton.innerHTML = '<span class="play-icon" aria-hidden="true">▶</span> Run again';
  });
}

const copyEmailButton = document.querySelector('#copy-email');
const copyStatus = document.querySelector('#copy-status');
copyEmailButton?.addEventListener('click', async () => {
  const email = copyEmailButton.dataset.email;
  try {
    await navigator.clipboard.writeText(email);
    copyStatus.textContent = 'Copied';
    copyEmailButton.textContent = 'Email copied';
    window.setTimeout(() => {
      copyStatus.textContent = '';
      copyEmailButton.textContent = 'Copy email';
    }, 2200);
  } catch {
    copyStatus.textContent = email;
  }
});

if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
  projectCards.forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const bounds = card.getBoundingClientRect();
      card.style.setProperty('--pointer-x', (event.clientX - bounds.left) + 'px');
      card.style.setProperty('--pointer-y', (event.clientY - bounds.top) + 'px');
    });
  });
}

const revealItems = document.querySelectorAll('[data-reveal]');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

document.querySelector('#year').textContent = new Date().getFullYear();
