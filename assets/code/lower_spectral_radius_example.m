% LOWER_SPECTRAL_RADIUS_EXAMPLE  Compare the paper's MATLAB methods S, A and E.
%
% Prerequisites:
%   MATLAB with Optimization Toolbox (linprog).
%   Download and extract the pinned ZIP below. Put this script beside its
%   MATLAB functions, select that folder as MATLAB's Current Folder, then enter:
%   lower_spectral_radius_example
%
% Paper: https://arxiv.org/abs/2409.16822
% Corrected source revision: 181d6b59be56a02dab1a040254b95c905d7f49ae (181d6b5).
% Tree: https://github.com/francescomaiale/subradius_computation/tree/181d6b59be56a02dab1a040254b95c905d7f49ae
% ZIP: https://github.com/francescomaiale/subradius_computation/archive/181d6b59be56a02dab1a040254b95c905d7f49ae.zip
% The repository functions are distributed under GPL-3.0; see its LICENSE.
%
% This wrapper does not download or write files. Experimental eigenvector
% variant E: this numerical example does not establish general convergence.
% Results use floating-point arithmetic and are not interval-arithmetic
% certificates. A search budget does not guarantee the requested accuracy.

required_functions = {'lsr_comp', 'adaptive_subradius_comp', ...
    'adaptive_eigenvectors_subradius_comp', 'aNorm', 'real_antinorm'};
for function_index = 1:numel(required_functions)
    if isempty(which(required_functions{function_index}))
        error('LSRExample:MissingRepositoryFunction', ...
            ['Cannot find %s. Put this script in the downloaded ' ...
             'subradius_computation folder and select that Current Folder.'], ...
            required_functions{function_index});
    end
end

if exist('linprog', 'file') == 0
    error('LSRExample:MissingOptimizationToolbox', ...
        'Optimization Toolbox is required: MATLAB cannot find linprog.');
end
if ~license('test', 'Optimization_Toolbox')
    error('LSRExample:OptimizationLicenseUnavailable', ...
        ['An Optimization Toolbox license is required. Check your MATLAB ' ...
         'license before running this example.']);
end

% The transposed family used by the repository's illustrative_example.m.
% The orientation matters for this antinorm implementation.
A_1 = [7 2; 0 3];
A_2 = [2 0; 4 8];

% A degree-eight product supplies a spectral upper bound used for scaling.
% Scaling is undone below; it is not an assumption about an unknown family.
Pi = A_1 * A_2 * (A_1^2 * A_2)^2;
scale = max(abs(eig(Pi)))^(1/8);
A = [A_1 A_2] / scale;

numeric_error = [0 0];  % The example assumes its input entries are exact.
delta = 1e-6;          % Requested gap on the normalized scale.
budgets = [10000 100 100]; % S, A, E; a complete level can exceed its budget.
V_in = eye(2);         % Initial polytope antinorm: the 1-antinorm.
show_progress = false;
prune_vertices = true;
theta = 1.1;           % Eigenvector scaling used by illustrative_example.m.

% Rows of the result arrays follow method_names: S, A, then E.
method_names = {'Standard S', 'Adaptive A', 'Eigenvector E (experimental)'};
normalized_bounds = zeros(3,2);
original_bounds = zeros(3,2);
normalized_gap = zeros(3,1);
original_gap = zeros(3,1);
elapsed_seconds = zeros(3,1);
performance = cell(3,1);
err_used = cell(3,1);
gap_status = cell(3,1);
gap_roundoff_allowance = zeros(3,1);

fprintf('\nLower spectral radius: S, corrected A, and experimental E\n');
fprintf('Source revision:              181d6b5\n');
fprintf('Scaling factor:               %.15g\n', scale);
fprintf('Requested normalized gap:     %.9g\n', delta);

for method_index = 1:3
    start_time = tic;
    switch method_index
        case 1
            [bounds, metrics, errors] = lsr_comp(A, numeric_error, delta, ...
                budgets(1), V_in, [], show_progress);
        case 2
            [bounds, metrics, errors] = adaptive_subradius_comp(A, ...
                numeric_error, delta, budgets(2), V_in, [], ...
                show_progress, prune_vertices);
        case 3
            [bounds, metrics, errors] = adaptive_eigenvectors_subradius_comp(A, ...
                numeric_error, delta, budgets(3), V_in, [], ...
                show_progress, theta, prune_vertices);
    end
    elapsed_seconds(method_index) = toc(start_time);

    if numel(bounds) ~= 2 || any(~isfinite(bounds)) || bounds(1) > bounds(2)
        error('LSRExample:InvalidOutput', ...
            '%s did not return finite, ordered numerical bounds.', ...
            method_names{method_index});
    end

    normalized_bounds(method_index,:) = bounds;
    original_bounds(method_index,:) = scale * bounds;
    normalized_gap(method_index) = bounds(2) - bounds(1);
    original_gap(method_index) = original_bounds(method_index,2) ...
        - original_bounds(method_index,1);
    performance{method_index} = metrics;
    err_used{method_index} = errors;

    % Subtraction can put a target-sized gap a few ulps above delta.
    % Report this explicitly; the allowance is not a solver error bound.
    gap_roundoff_allowance(method_index) = 16 * eps(max(1,max(abs(bounds))));
    if normalized_gap(method_index) <= delta
        gap_status{method_index} = 'Within the requested numerical gap.';
    elseif normalized_gap(method_index) <= delta + gap_roundoff_allowance(method_index)
        gap_status{method_index} = ...
            'Above the target only within the reporting roundoff allowance.';
    else
        gap_status{method_index} = 'Requested numerical gap NOT reached.';
    end

    fprintf('\n%s\n', method_names{method_index});
    fprintf('Normalized numerical bounds:  [%.17g, %.17g]\n', bounds);
    fprintf('Original-scale bounds:        [%.17g, %.17g]\n', ...
        original_bounds(method_index,:));
    fprintf('Normalized gap:               %.17g\n', normalized_gap(method_index));
    fprintf('Original-scale gap:            %.17g\n', original_gap(method_index));
    fprintf('Products examined:            %g (budget %g)\n', ...
        metrics(3), budgets(method_index));
    fprintf('Elapsed time:                 %.3f seconds\n', elapsed_seconds(method_index));
    fprintf('%s\n', gap_status{method_index});
    if normalized_gap(method_index) > delta && ...
            normalized_gap(method_index) <= delta + gap_roundoff_allowance(method_index)
        fprintf('Reporting roundoff allowance: %.17g (not a certified error bound).\n', ...
            gap_roundoff_allowance(method_index));
    end
end

fprintf(['\nExperimental eigenvector variant E: this numerical example does ' ...
         'not establish general convergence.\n']);
fprintf(['These are floating-point results, not independently certified ' ...
         'interval-arithmetic bounds.\n']);
