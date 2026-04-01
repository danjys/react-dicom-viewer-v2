docker-compose up --build
docker-compose up -d --build // release terminal
docker-compose logs -f

docker-compose down

Auth: (default)
orthanc orthanc

TREE STRUCTURE
find . -maxdepth 2
find . -maxdepth 3 \( -path ./dicom-viewer/node_modules -o -path ./dicom-viewer/.git -o -path ./data -o -path ./data-backup -o -path ./.git \) -prune -o -print

| Resource                 | Example Endpoint                  |
| ------------------------ | --------------------------------- |
| Patients                 | `http://localhost:8042/patients`  |
| Studies                  | `http://localhost:8042/studies`   |
| Series                   | `http://localhost:8042/series`    |
| Instances (DICOM images) | `http://localhost:8042/instances` |


curl -u orthanc:orthanc http://localhost:8042/patients
curl -u orthanc:orthanc http://localhost:8042/patients/b6589fc6-ab0dc82c-f12099d1-c2d40ab9-94e8410c/studies