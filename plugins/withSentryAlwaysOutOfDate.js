const { withXcodeProject } = require('expo/config-plugins');

/**
 * The @sentry/react-native/expo plugin adds an "Upload Debug Symbols to Sentry"
 * shell script phase with no declared inputs/outputs, so Xcode warns
 * "Script has ambiguous dependencies causing it to run on every build".
 *
 * Marking the phase `alwaysOutOfDate` is the project-file equivalent of
 * unchecking "Based on dependency analysis" — it declares the script is
 * intentionally run on every build and silences the warning.
 *
 * Must run AFTER "@sentry/react-native/expo" in app.json plugins.
 */
module.exports = function withSentryAlwaysOutOfDate(config) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const phase = project.pbxItemByComment(
      'Upload Debug Symbols to Sentry',
      'PBXShellScriptBuildPhase'
    );
    if (phase) {
      phase.alwaysOutOfDate = '1';
    }
    return config;
  });
};
