const {
  withXcodeProject,
  IOSConfig,
} = require('expo/config-plugins');

/**
 * Strip DEVELOPMENT_TEAM from the pbxproj on every prebuild.
 *
 * expo run:ios decides whether to pass `-allowProvisioningUpdates` /
 * `-allowProvisioningDeviceRegistration` to xcodebuild based on
 * `isCodeSigningConfigured` (see @expo/cli run/ios/codeSigning/configureCodeSigning):
 * any DEVELOPMENT_TEAM in the project counts as "configured" and the flags are
 * skipped — so a team present without an existing profile can never create one
 * ("No profiles ... were found ... pass -allowProvisioningUpdates").
 *
 * By removing the team here, every `expo run:ios --device` re-runs expo's
 * auto-signing setup, which writes the team back AND passes the provisioning
 * flags, letting xcodebuild create/refresh the profile and register the device.
 * Note: expo writes the team back into the pbxproj at build time, so the file
 * will show as modified after a device build — that is expected.
 */
module.exports = function withResetAutoSigning(config) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const targets = IOSConfig.Target.findSignableTargets(project);

    for (const [nativeTargetId, nativeTarget] of targets) {
      IOSConfig.XcodeUtils.getBuildConfigurationsForListId(
        project,
        nativeTarget.buildConfigurationList
      )
        .filter(([, item]) => item.buildSettings.PRODUCT_NAME)
        .forEach(([, item]) => {
          delete item.buildSettings.DEVELOPMENT_TEAM;
        });

      Object.entries(IOSConfig.XcodeUtils.getProjectSection(project))
        .filter(IOSConfig.XcodeUtils.isNotComment)
        .forEach(([, item]) => {
          const attrs = item.attributes.TargetAttributes?.[nativeTargetId];
          if (attrs) {
            delete attrs.DevelopmentTeam;
            delete attrs.ProvisioningStyle;
          }
        });
    }
    return config;
  });
};
