(() => {
  'use strict';

  const panel = document.querySelector('[data-interactive="lower-spectral-radius"]');
  if (!panel) return;

  const matrices = [[7, 0, 2, 3], [2, 4, 0, 8]];
  const mixedWord = [0, 1, 0, 0, 1, 0, 0, 1];
  const limit = 10;
  const find = (name) => panel.querySelector(`[data-lsr-${name}]`);
  const buttons = {
    one: panel.querySelector('[data-lsr-action="append-one"]'),
    two: panel.querySelector('[data-lsr-action="append-two"]'),
    undo: panel.querySelector('[data-lsr-action="undo"]'),
    reset: panel.querySelector('[data-lsr-action="reset"]')
  };
  const outputs = {
    word: find('word'), rate: find('rate'), length: find('length'),
    count: find('word-count'), nextOne: find('next-one'), nextTwo: find('next-two'),
    matrix: find('matrix'), status: find('status'),
    svgDescription: find('svg-description'), svgLength: find('svg-length'),
    svgWord: find('svg-word'), svgCurrent: find('svg-current'),
    svgNextOne: find('svg-next-one'), svgNextTwo: find('svg-next-two'),
    svgCaptionOne: find('svg-next-one-caption'), svgCaptionTwo: find('svg-next-two-caption')
  };
  const entries = Array.from(panel.querySelectorAll('[data-lsr-entry]'));
  if (Object.values(buttons).some((element) => !element) ||
      Object.values(outputs).some((element) => !element) || entries.length !== 4) return;

  let word = [];

  function multiply(left, right) {
    return [
      left[0] * right[0] + left[1] * right[2],
      left[0] * right[1] + left[1] * right[3],
      left[2] * right[0] + left[3] * right[2],
      left[2] * right[1] + left[3] * right[3]
    ];
  }

  function spectralRadius(matrix) {
    const [a, b, c, d] = matrix;
    return (a + d + Math.sqrt((a - d) ** 2 + 4 * b * c)) / 2;
  }

  function growth(matrix, length) {
    return spectralRadius(matrix) ** (1 / length);
  }

  function rateText(value) {
    return value.toFixed(11).replace(/\.?0+$/, '');
  }

  function matrixName(index) {
    return index === 0 ? 'A₁' : 'A₂';
  }

  function render(announcement) {
    const length = word.length;
    const product = word.reduce((current, index) => multiply(current, matrices[index]), [1, 0, 0, 1]);
    const wordText = length ? word.map(matrixName).join(' · ') : 'Identity · no choices yet';
    const currentRate = length ? rateText(growth(product, length)) : '—';
    const atLimit = length === limit;
    const nextRates = matrices.map((matrix) => atLimit ? null : rateText(growth(multiply(product, matrix), length + 1)));

    outputs.word.textContent = wordText;
    outputs.rate.textContent = currentRate;
    outputs.length.textContent = `${length} / ${limit}`;
    outputs.count.textContent = String(2 ** length);
    outputs.nextOne.textContent = nextRates[0] ?? 'Limit reached';
    outputs.nextTwo.textContent = nextRates[1] ?? 'Limit reached';
    entries.forEach((entry, index) => { entry.textContent = String(product[index]); });
    outputs.matrix.setAttribute('aria-label', `Product P, with rows ${product[0]}, ${product[1]} and ${product[2]}, ${product[3]}`);

    outputs.svgLength.textContent = `Current word · ${length} ${length === 1 ? 'choice' : 'choices'}`;
    outputs.svgWord.textContent = length ? `P = ${word.map(matrixName).join('')}` : 'P = I';
    outputs.svgCurrent.textContent = `Growth per step: ${currentRate}`;
    outputs.svgNextOne.textContent = nextRates[0] ?? 'Limit reached';
    outputs.svgNextTwo.textContent = nextRates[1] ?? 'Limit reached';
    outputs.svgCaptionOne.textContent = atLimit ? 'Undo to explore another choice' : `Growth per step · length ${length + 1}`;
    outputs.svgCaptionTwo.textContent = outputs.svgCaptionOne.textContent;
    outputs.svgDescription.textContent = atLimit
      ? `The current word has ${length} choices and repeated-word growth per step ${currentRate}. The limit of ${limit} choices is reached. Undo or reset to continue.`
      : `The current word has ${length} choices${length ? ` and repeated-word growth per step ${currentRate}` : ''}. Appending A one gives ${nextRates[0]}; appending A two gives ${nextRates[1]}, each at length ${length + 1}. These are candidate periodic-word upper bounds, not a search over all words.`;

    buttons.one.disabled = atLimit;
    buttons.two.disabled = atLimit;
    buttons.undo.disabled = length === 0;
    if (announcement) {
      outputs.status.textContent = `${announcement} ${length ? `Length ${length}; repeated-word growth per step ${currentRate}.` : 'The word is empty.'}${atLimit ? ' The 10-choice limit is reached. Undo or reset to continue.' : ''}`;
    }
  }

  function append(index) {
    if (word.length >= limit) return;
    word.push(index);
    render(`Appended ${matrixName(index)}.`);
  }

  buttons.one.addEventListener('click', () => append(0));
  buttons.two.addEventListener('click', () => append(1));
  buttons.undo.addEventListener('click', () => {
    if (!word.length) return;
    const removed = word.pop();
    render(`Removed ${matrixName(removed)}.`);
  });
  buttons.reset.addEventListener('click', () => {
    word = [];
    render('Reset.');
  });
  panel.querySelectorAll('[data-lsr-preset]').forEach((button) => {
    button.addEventListener('click', () => {
      const preset = button.getAttribute('data-lsr-preset');
      word = preset === 'mixed' ? mixedWord.slice() : [preset === 'one' ? 0 : 1];
      render(preset === 'mixed' ? 'Loaded the paper’s eight-choice mixed word.' : `Loaded ${matrixName(word[0])}.`);
    });
  });

  render();
  panel.hidden = false;
  const figure = panel.closest('figure');
  if (figure) figure.querySelectorAll('[data-diagram-fallback]').forEach((element) => { element.hidden = true; });
})();

(() => {
  'use strict';
  const panel = document.querySelector('[data-interactive="tangent-paraboloids"]');
  if (!panel) return;

  const find = selector => panel.querySelector(selector);
  const alphaInput = find('[data-tp-alpha]');
  const zoomInput = find('[data-tp-zoom]');
  const alphaOutput = find('[data-tp-alpha-value]');
  const zoomOutput = find('[data-tp-zoom-value]');
  const radiusOutput = find('[data-tp-radius]');
  const rawOutput = find('[data-tp-raw-error]');
  const relativeOutput = find('[data-tp-relative-error]');
  const area = find('[data-tp-area]');
  const curve = find('[data-tp-curve]');
  const description = find('[data-tp-description]');
  const reset = find('[data-tp-reset]');
  if (![alphaInput, zoomInput, alphaOutput, zoomOutput, radiusOutput,
    rawOutput, relativeOutput, area, curve, description, reset].every(Boolean)) return;

  // Both axes use distances divided by the selected physical scale r.
  const plot = { left: 125, bottom: 380, width: 800, height: 350 };
  const format = value => Number(value.toPrecision(6)).toString();
  function readout(node, value) {
    node.textContent = format(value);
    node.dataset.value = String(value);
    node.title = String(value);
  }

  function render() {
    const alpha = Number(alphaInput.value);
    const step = Number(zoomInput.value);
    if (!Number.isFinite(alpha) || alpha < 0.1 || alpha > 1 ||
        !Number.isInteger(step) || step < 0 || step > 8) return false;
    const radius = 2 ** (-step);
    const rawError = radius ** (1 + alpha);
    const relativeError = radius ** alpha;
    if (![radius, rawError, relativeError].every(Number.isFinite)) return false;

    const points = [];
    for (let index = 0; index <= 200; index++) {
      const x = index / 200;
      const y = relativeError * x ** (1 + alpha);
      const screenX = plot.left + plot.width * x;
      const screenY = plot.bottom - plot.height * y;
      points.push(`${screenX.toFixed(3)} ${screenY.toFixed(3)}`);
    }
    const path = `M${points.join(' L')}`;
    curve.setAttribute('d', path);
    area.setAttribute('d', `${path} L${plot.left + plot.width} ${plot.bottom} Z`);

    alphaOutput.textContent = alpha.toFixed(2);
    zoomOutput.textContent = `step ${step} of 8`;
    alphaInput.setAttribute('aria-valuetext', `alpha ${alpha.toFixed(2)}`);
    zoomInput.setAttribute('aria-valuetext', `step ${step} of 8; scale r ${format(radius)}`);
    readout(radiusOutput, radius);
    readout(rawOutput, rawError);
    readout(relativeOutput, relativeError);
    description.textContent = `Normalized distance profile with alpha ${alpha.toFixed(2)}, scale r ${format(radius)}, and lambda 1. ` +
      `The dashed linear reference is y equals x. The green envelope is y equals r to the power alpha times x to the power one plus alpha. ` +
      `Its endpoint at x equals one is ${format(relativeError)}. The raw error bound there is ${format(rawError)}. ` +
      'This is a schematic distance profile, not a surface or a set of data points. It does not assert containment of all points of a measurable set.';
    return true;
  }

  try {
    if (!render()) return;
    alphaInput.addEventListener('input', render);
    zoomInput.addEventListener('input', render);
    reset.addEventListener('click', () => {
      alphaInput.value = '0.5';
      zoomInput.value = '0';
      render();
    });
    panel.hidden = false;
    const figure = panel.closest('figure');
    if (figure) figure.querySelectorAll('[data-diagram-fallback]').forEach(fallback => {
      fallback.hidden = true;
    });
  } catch (_) {
    // The article's static figure remains the fallback if setup cannot finish.
    panel.hidden = true;
  }
})();

(() => {
  'use strict';

  const panel = document.querySelector('[data-interactive="optimal-reinforcements"]');
  if (!panel) return;

  const find = (name) => panel.querySelector(`[data-reinforcement-${name}]`);
  const layoutControl = find('layout');
  const rotationControl = find('rotation');
  const xControl = find('x');
  const yControl = find('y');
  const resetControl = find('reset');
  const angleOutput = find('angle');
  const xOutput = find('x-value');
  const yOutput = find('y-value');
  const lengthOutput = find('length');
  const positionHint = find('position-hint');
  const svg = find('svg');
  const svgTitle = find('svg-title');
  const svgDescription = find('svg-description');
  const paths = find('paths');
  const legend = find('legend');
  if ([layoutControl, rotationControl, xControl, yControl, resetControl,
    angleOutput, xOutput, yOutput, lengthOutput, positionHint, svg,
    svgTitle, svgDescription, paths, legend].some((element) => !element)) return;

  const layouts = {
    straight: { name: 'Straight segment', lines: [[[-0.5, 0], [0.5, 0]]] },
    bent: { name: 'Bent path', lines: [[[-0.25, -0.25], [0.25, -0.25], [0.25, 0.25]]] },
    cross: { name: 'Cross with four branches', lines: [
      [[-0.25, 0], [0.25, 0]], [[0, -0.25], [0, 0.25]]
    ] }
  };
  const svgNamespace = 'http://www.w3.org/2000/svg';
  const epsilon = 1e-12;
  const percentage = (control) => Math.max(0, Math.min(100, Number(control.value)));
  const snapUnit = (value) => Math.abs(value) < epsilon ? 0 :
    Math.abs(value - 1) < epsilon ? 1 : value;

  function render() {
    const layout = layouts[layoutControl.value] || layouts.straight;
    const degrees = Number(rotationControl.value);
    const angle = degrees * Math.PI / 180;
    const rawCosine = Math.cos(angle);
    const rawSine = Math.sin(angle);
    const cosine = Math.abs(rawCosine) < epsilon ? 0 : rawCosine;
    const sine = Math.abs(rawSine) < epsilon ? 0 : rawSine;
    const rotated = layout.lines.map((line) => line.map(([x, y]) =>
      [cosine * x - sine * y, sine * x + cosine * y]));
    const vertices = rotated.reduce((all, line) => all.concat(line), []);
    const minX = Math.min(...vertices.map((point) => point[0]));
    const maxX = Math.max(...vertices.map((point) => point[0]));
    const minY = Math.min(...vertices.map((point) => point[1]));
    const maxY = Math.max(...vertices.map((point) => point[1]));

    // Translate only within the rotated bounding box's feasible range.
    // Rigid rotation and translation preserve length and connectivity.
    const xLower = -minX;
    const xUpper = 1 - maxX;
    const yLower = -minY;
    const yUpper = 1 - maxY;
    const xFixed = xUpper - xLower <= epsilon;
    const yFixed = yUpper - yLower <= epsilon;
    const xPercent = percentage(xControl);
    const yPercent = percentage(yControl);
    const translateX = xFixed ? (xLower + xUpper) / 2 :
      xLower + (xUpper - xLower) * xPercent / 100;
    const translateY = yFixed ? (yLower + yUpper) / 2 :
      yLower + (yUpper - yLower) * yPercent / 100;
    const placed = rotated.map((line) => line.map(([x, y]) =>
      [snapUnit(x + translateX), snapUnit(y + translateY)]));

    while (paths.firstChild) paths.removeChild(paths.firstChild);
    let totalLength = 0;
    placed.forEach((line) => {
      const polyline = document.createElementNS(svgNamespace, 'polyline');
      polyline.setAttribute('points', line.map(([x, y]) =>
        `${100 + 400 * x},${440 - 400 * y}`).join(' '));
      paths.appendChild(polyline);
      for (let index = 1; index < line.length; index += 1) {
        totalLength += Math.hypot(line[index][0] - line[index - 1][0],
          line[index][1] - line[index - 1][1]);
      }
    });

    xControl.disabled = xFixed;
    yControl.disabled = yFixed;
    angleOutput.textContent = `${degrees}°`;
    xOutput.textContent = xFixed ? 'Fixed' : `${xPercent}%`;
    yOutput.textContent = yFixed ? 'Fixed' : `${yPercent}%`;
    rotationControl.setAttribute('aria-valuetext', `${degrees} degrees`);
    xControl.setAttribute('aria-valuetext', xFixed ? 'Fixed by this rotation' :
      `${xPercent} percent of the available horizontal range`);
    yControl.setAttribute('aria-valuetext', yFixed ? 'Fixed by this rotation' :
      `${yPercent} percent of the available vertical range`);
    lengthOutput.textContent = `${Number(totalLength.toFixed(10))} unit`;
    if (xFixed && yFixed) {
      positionHint.textContent = 'This rotation spans the full width and height; both positions are fixed.';
    } else if (xFixed) {
      positionHint.textContent = 'This rotation spans the full width, so horizontal placement is fixed. You can still move it vertically.';
    } else if (yFixed) {
      positionHint.textContent = 'This rotation spans the full height, so vertical placement is fixed. You can still move it horizontally.';
    } else {
      positionHint.textContent = 'Position sliders cover the space left after rotation, keeping every point in the closed unit square.';
    }
    svgTitle.textContent = `${layout.name}: a connected unit-length reinforcement`;
    svgDescription.textContent = `The ${layout.name.toLowerCase()} is rotated ${degrees} degrees and stays in the closed unit square. Its total length is one and its uniform density is one; the material coefficient stays fixed. The copper structure adds finite tangential stiffness, not an internal clamp. No eigenvalue or optimum is computed.`;
  }

  function resizeDiagram() {
    const narrow = smallScreen && smallScreen.matches;
    svg.setAttribute('viewBox', narrow ? '0 0 560 500' : '0 0 1000 500');
    svg.setAttribute('width', narrow ? '560' : '1000');
    legend.setAttribute('display', narrow ? 'none' : 'inline');
  }

  [layoutControl, rotationControl, xControl, yControl].forEach((control) => {
    control.addEventListener('input', render);
    control.addEventListener('change', render);
  });
  resetControl.addEventListener('click', () => {
    layoutControl.value = 'straight';
    rotationControl.value = '0';
    xControl.value = '50';
    yControl.value = '50';
    render();
  });
  const smallScreen = typeof window.matchMedia === 'function' ?
    window.matchMedia('(max-width: 600px)') : null;
  if (smallScreen) {
    if (typeof smallScreen.addEventListener === 'function') {
      smallScreen.addEventListener('change', resizeDiagram);
    } else if (typeof smallScreen.addListener === 'function') {
      smallScreen.addListener(resizeDiagram);
    }
  }
  render();
  resizeDiagram();
  panel.hidden = false;
  const figure = panel.closest('figure');
  if (figure) figure.querySelectorAll('[data-diagram-fallback]').forEach((fallback) => {
    fallback.hidden = true;
  });
})();
