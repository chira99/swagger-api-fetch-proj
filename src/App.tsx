// NOTE: set your swaggerHub API-KEY as REACT_APP_API_TOKEN=<API-KEY> in a .env file in the root level

import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Organization {
  name: string;
  description: string;
  email: string;
  id: string;
  memberCount: number;
}

interface Project {
  name: string;
  owner: string;
  description: string;
}

interface ApiVersion {
  url: string;
  value: string;
}

const App: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [apis, setApis] = useState<string[]>([]);
  const [apiVersions, setApiVersions] = useState<ApiVersion[]>([]);
  const [yamlDefinition, setYamlDefinition] = useState<string | null>(null);

  const [loadingOrganizations, setLoadingOrganizations] =
    useState<boolean>(false);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(false);
  const [loadingApis, setLoadingApis] = useState<boolean>(false);
  const [loadingApiVersions, setLoadingApiVersions] = useState<boolean>(false);
  const [loadingYaml, setLoadingYaml] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);

  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedApi, setSelectedApi] = useState<string | null>(null);

  const fetchOrganizations = async () => {
    setOrganizations([]); // Clear the current organizations immediately
    setProjects([]); // Clear projects as they depend on organizations
    setApis([]); // Clear APIs as they depend on projects
    setApiVersions([]); // Clear API versions as they depend on APIs
    setYamlDefinition(null); // Clear YAML definition as it depends on API versions
    setLoadingOrganizations(true);
    setError(null);
    try {
      const response = await axios.get("/user-management/v1/orgs", {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${process.env.REACT_APP_API_TOKEN}`,
        },
        params: { sortBy: "NAME", order: "ASC", page: 0, pageSize: 100 },
      });
      setOrganizations(response.data.items || []);
    } catch (err) {
      setError("Failed to fetch organizations.");
    } finally {
      setLoadingOrganizations(false);
    }
  };

  const fetchProjects = async (owner: string) => {
    setProjects([]); // Clear the current projects immediately
    setApis([]); // Clear APIs as they depend on projects
    setApiVersions([]); // Clear API versions as they depend on APIs
    setYamlDefinition(null); // Clear YAML definition as it depends on API versions
    setLoadingProjects(true);
    setError(null);
    try {
      const response = await axios.get(`/projects/${owner}`, {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${process.env.REACT_APP_API_TOKEN}`,
        },
        params: { nameOnly: true, page: 0, limit: 100, order: "ASC" },
      });
      setProjects(response.data.projects || []);
    } catch (err) {
      setError("Failed to fetch projects.");
    } finally {
      setLoadingProjects(false);
    }
  };
  
  const fetchApis = async (owner: string, project: string) => {
    setApis([]); // Clear the current APIs immediately
    setApiVersions([]); // Clear API versions as they depend on APIs
    setYamlDefinition(null); // Clear YAML definition as it depends on API versions
    setLoadingApis(true);
    setError(null);
    try {
      const response = await axios.get(`/projects/${owner}/${project}`, {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${process.env.REACT_APP_API_TOKEN}`,
        },
      });
      setApis(response.data.apis || []);
    } catch (err) {
      setError("Failed to fetch APIs.");
    } finally {
      setLoadingApis(false);
    }
  };
  
  const fetchApiVersions = async (owner: string, api: string) => {
    setApiVersions([]); // Clear the current API versions immediately
    setYamlDefinition(null); // Clear YAML definition as it depends on API versions
    setLoadingApiVersions(true);
    setError(null);
    try {
      const response = await axios.get(`/apis/${owner}/${api}`, {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${process.env.REACT_APP_API_TOKEN}`,
        },
      });
      const versions = response.data.apis.map((item: any) =>
        item.properties.find((prop: any) => prop.type === "X-Version")
      );
      setApiVersions(versions || []);
    } catch (err) {
      setError("Failed to fetch API versions.");
    } finally {
      setLoadingApiVersions(false);
    }
  };


  const fetchYamlDefinition = async (
    owner: string,
    api: string,
    version: string
  ) => {
    setYamlDefinition(null); // Clear the current YAML definition immediately
    setLoadingYaml(true);
    setError(null);
    try {
      const response = await axios.get(
        `/apis/${owner}/${api}/${version}/swagger.yaml`,
        {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${process.env.REACT_APP_API_TOKEN}`,
          },
        }
      );
      setYamlDefinition(response.data);
    } catch (err) {
      setError("Failed to fetch YAML definition.");
    } finally {
      setLoadingYaml(false);
    }
  };
  

  useEffect(() => {
    fetchOrganizations();
  }, []);

  return (
    <div>
      <h1>Organizations</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {loadingOrganizations ? (
        <p>Loading organizations...</p>
      ) : (
        <ul>
          {organizations.map((org) => (
            <li
              key={org.id}
              onClick={() => {
                setSelectedOrg(org.name);
                fetchProjects(org.name);
              }}
            >
              <h3>{org.name}</h3>
            </li>
          ))}
        </ul>
      )}

      {/* show projects after org is selected */}
      {selectedOrg && (
        <>
          <h2>Projects</h2>
          {loadingProjects ? (
            <p>Loading projects...</p>
          ) : (
            <ul>
              {projects.map((proj) => (
                <li
                  key={proj.name}
                  onClick={() => {
                    setSelectedProject(proj.name);
                    fetchApis(selectedOrg, proj.name);
                  }}
                >
                  <h3>{proj.name}</h3>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* show APIs when project is selected */}
      {selectedProject && (
        <>
          <h2>APIs</h2>
          {loadingApis ? (
            <p>Loading APIs...</p>
          ) : (
            <ul>
              {apis.map((api) => (
                <li
                  key={api}
                  onClick={() => {
                    setSelectedApi(api);
                    fetchApiVersions(selectedOrg!, api);
                  }}
                >
                  <h3>{api}</h3>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* show API versions when API name is selected */}
      {selectedApi && (
        <>
          <h2>API Versions</h2>
          {loadingApiVersions ? (
            <p>Loading versions...</p>
          ) : (
            <ul>
              {apiVersions.map((ver) => (
                <li
                  key={ver.value}
                  onClick={() => fetchYamlDefinition(selectedOrg!, selectedApi, ver.value)}
                >
                  <p>{ver.value}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* show API spec when API version name is selected */}
      {yamlDefinition && (
        <>
          <h2>YAML Definition</h2>
          <pre>{yamlDefinition}</pre>
        </>
      )}
      {loadingYaml && <p>Loading YAML definition...</p>}
    </div>
  );
};

export default App;
