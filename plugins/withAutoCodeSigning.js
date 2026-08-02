const {
  withXcodeProject,
  IOSConfig,
} = require('expo/config-plugins');

/**
 * Force full automatic code signing on the app target at prebuild time.
 *
 * expo run:ios only writes automatic-signing settings when the pbxproj has NO
 * DEVELOPMENT_TEAM yet (see @expo/cli run/ios/codeSigning/configureCodeSigning).
 * A pbxproj that has DEVELOPMENT_TEAM but no CODE_SIGN_STYLE stays in a broken
 * half-configured state: xcodebuild falls back to Manual signing and fails with
 * "Automatic signing is disabled and unable to generate a profile".
 *
 * This mirrors @expo/cli's own mutateXcodeProjectWithAutoCodeSigningInfo
 * (DEVELOPMENT_TEAM + CODE_SIGN_IDENTITY + CODE_SIGN_STYLE=Automatic +
 * ProvisioningStyle=Automatic), applied on every prebuild so it cannot drift.
 */
module.exports = function withAutoCodeSigning(config) {
  const teamId = config.ios?.developmentTeam;
  if (!teamId) {
    throw new Error(
      'withAutoCodeSigning: set "ios.developmentTeam" in app.json first'
    );
  }
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const quotedTeamId = `"${teamId}"`;
    const targets = IOSConfig.Target.findSignableTargets(project);

    for (const [nativeTargetId, nativeTarget] of targets) {
      IOSConfig.XcodeUtils.getBuildConfigurationsForListId(
        project,
        nativeTarget.buildConfigurationList
      )
        .filter(([, item]) => item.buildSettings.PRODUCT_NAME)
        .forEach(([, item]) => {
          item.buildSettings.DEVELOPMENT_TEAM = quotedTeamId;
          item.buildSettings.CODE_SIGN_IDENTITY = '"Apple Development"';
          item.buildSettings.CODE_SIGN_STYLE = 'Automatic';
        });

      Object.entries(IOSConfig.XcodeUtils.getProjectSection(project))
        .filter(IOSConfig.XcodeUtils.isNotComment)
        .forEach(([, item]) => {
          if (!item.attributes.TargetAttributes) {
            item.attributes.TargetAttributes = {};
          }
          if (!item.attributes.TargetAttributes[nativeTargetId]) {
            item.attributes.TargetAttributes[nativeTargetId] = {};
          }
          item.attributes.TargetAttributes[nativeTargetId].DevelopmentTeam =
            quotedTeamId;
          item.attributes.TargetAttributes[nativeTargetId].ProvisioningStyle =
            'Automatic';
        });
    }
    return config;
  });
};
