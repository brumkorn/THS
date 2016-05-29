System.trace = true;

window.showModuleRelationships = function () {
  var modules = Object.keys(System.loads)
    .map(function (moduleName) {
      return System.loads[moduleName];
    });

  function displayName(module) {
    return module
      //.replace(System.baseURL, "")
      //.replace("npm:", "jspm_packages/npm/")
      //.replace("github:", "jspm_packages/github/")
      .replace(/^(.*[\\\/])/,"");
  }

  var moduleDefinitions = modules.map(function (module) {
    var name = displayName(module.name);
    return `[${name}| ${module.metadata.format}]`;
  });

  var dependencyDefinitions = [];

  modules
    .filter(function (module) {
      return module.deps.length > 0;
    })
    .forEach(function (module) {
      var name = displayName(module.name);

      var dependencies = module.deps
        .map(displayName)
        .map(function (dependencyName) {
          return "[" + name + "]->[" + dependencyName + "]"
        });

      dependencyDefinitions = dependencyDefinitions.concat(dependencies);
    });

  var definitions = moduleDefinitions.concat(dependencyDefinitions);

  window.open("http://yuml.me/diagram/plain/class/" + definitions);

};