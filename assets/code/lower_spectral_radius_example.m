% LOWER_SPECTRAL_RADIUS_EXAMPLE  Run the paper's standard MATLAB method.
%
% Prerequisites:
%   MATLAB with Optimization Toolbox (linprog).
%   Download the public repository below. Put this script beside lsr_comp.m,
%   aNorm.m and real_antinorm.m, select that folder as MATLAB's Current Folder,
%   then enter: lower_spectral_radius_example
%
% Paper: https://arxiv.org/abs/2409.16822
% Code:  https://github.com/francescomaiale/subradius_computation
% The repository functions are distributed under GPL-3.0; see its LICENSE.
%
% This wrapper uses Algorithm S only. It does not download or write files.
% Results use floating-point arithmetic and are not interval-arithmetic
% certificates. A search budget does not guarantee the requested accuracy.

required_functions = {'lsr_comp', 'aNorm', 'real_antinorm'};
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
M = 10000;             % Search budget; a complete level can exceed it.
V_in = eye(2);         % Initial polytope antinorm: the 1-antinorm.
show_progress = false;

start_time = tic;
[normalized_bounds, performance, err_used] = ...
    lsr_comp(A, numeric_error, delta, M, V_in, [], show_progress);
elapsed_seconds = toc(start_time);

if numel(normalized_bounds) ~= 2 || any(~isfinite(normalized_bounds)) || ...
        normalized_bounds(1) > normalized_bounds(2)
    error('LSRExample:InvalidOutput', ...
        'The solver did not return a finite, ordered two-element interval.');
end

original_bounds = scale * normalized_bounds;
normalized_gap = normalized_bounds(2) - normalized_bounds(1);
original_gap = original_bounds(2) - original_bounds(1);

fprintf('\nStandard method (Algorithm S)\n');
fprintf('Scaling factor:               %.15g\n', scale);
fprintf('Normalized numerical bounds:  [%.15g, %.15g]\n', normalized_bounds);
fprintf('Original-scale bounds:        [%.15g, %.15g]\n', original_bounds);
fprintf('Normalized gap:               %.9g\n', normalized_gap);
fprintf('Requested normalized gap:     %.9g\n', delta);
fprintf('Original-scale gap:            %.9g\n', original_gap);
fprintf('Products examined:            %g (budget %g)\n', performance(3), M);
fprintf('Elapsed time:                 %.3f seconds\n', elapsed_seconds);

if normalized_gap <= delta
    fprintf('The numerical gap criterion was met in this run.\n');
else
    fprintf(['The requested gap was NOT reached. A larger M explores more ' ...
             'products and may require more time and memory.\n']);
end
fprintf(['These are floating-point results, not independently certified ' ...
         'interval-arithmetic bounds.\n']);
