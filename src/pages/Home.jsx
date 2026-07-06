import { useState } from "react";
import { today as initialToday } from "../data/mockData";
import "./Dashboard.css";


const initialMeds = [
  {
    id:"vitD",
    name:"Vitamin D",
    time:"Morning",
    taken:false
  },
  {
    id:"omega",
    name:"Omega-3",
    time:"Morning",
    taken:false
  },
  {
    id:"mag",
    name:"Magnesium",
    time:"Night",
    taken:false
  }
];


function Home(){

const [day] = useState(initialToday);


const [meds,setMeds] =
useState(initialMeds);
const [newMedication, setNewMedication] = useState("");
const [newMedicationTime, setNewMedicationTime] = useState("Morning");


const [sleep,setSleep] =
useState(null);


const [weight,setWeight] =
useState(null);


const [workout,setWorkout] =
useState(false);


const [mood,setMood] =
useState(0);


const [energy,setEnergy] =
useState(0);



const completed =
meds.filter(m=>m.taken).length +
(sleep ? 1:0) +
(weight ? 1:0) +
(workout ? 1:0) +
(mood ? 1:0) +
(energy ? 1:0);



const completion =
Math.round(
(completed / 8) * 100
);



function toggleMed(id){

setMeds(prev =>
prev.map(m=>
m.id===id
?
{
...m,
taken:true
}
:
m
));

}

function addMedication() {

  const name = newMedication.trim();

  if (!name) return;

  setMeds(prev => [
    ...prev,
    {
      id: crypto.randomUUID(),
      name,
      time: newMedicationTime,
      taken: false
    }
  ]);

  setNewMedication("");
  setNewMedicationTime("Morning");

}


function deleteMedication(id) {

  setMeds(prev =>
    prev.filter(m => m.id !== id)
  );

}



return (

<div className="routine-page">


<header className="header">

<div className="day-label">
{day.date}
</div>


<h1>
Good morning.
</h1>

</header>




<div className="completion-block">

<div className="completion-header">

<span>
DAILY COMPLETION
</span>


<b>
{completion}%
</b>

</div>


<div className="progress">

<div
style={{
width:`${completion}%`
}}
/>

</div>


</div>





<div className="divider"/>





<section>

<h3>
MEDICATIONS
</h3>

<div className="add-medication">

    <input
        type="text"
        placeholder="Medication name"
        value={newMedication}
        onChange={(e)=>setNewMedication(e.target.value)}
    />

    <select
        value={newMedicationTime}
        onChange={(e)=>setNewMedicationTime(e.target.value)}
    >
        <option>Morning</option>
        <option>Afternoon</option>
        <option>Night</option>
    </select>

    <button
        className="add-med-btn"
        onClick={addMedication}
    >
        Add
    </button>

</div>

{
meds.map(m => (

<div
    className="med-item"
    key={m.id}
>

    <div className="med-info">

        <div className="med-name">
            {m.name}
        </div>

        <div className="med-time">
            {m.time}
            {" · "}
            {m.taken ? "Taken" : "Not logged"}
        </div>

    </div>

    <div className="med-actions">

        <button
            className={
                m.taken
                ? "med-btn taken"
                : "med-btn"
            }
            onClick={() => toggleMed(m.id)}
        >
            {m.taken
                ? "Taken"
                : "Mark as taken"}
        </button>

        <button
            className="delete-med-btn"
            onClick={() => deleteMedication(m.id)}
        >
            ✕
        </button>

    </div>

</div>

))
}

</section>





<div className="divider"/>





<section>


<h3>
SLEEP
</h3>


<div className="metric-row">


<div>

<div className="metric-name">

{
sleep
?
`${sleep}h`
:
"Not logged"
}

</div>


<div className="metric-sub">
Duration
</div>


</div>




<div className="stepper">

<button
onClick={()=>
setSleep(
sleep
?
sleep-0.5
:
7.5
)
}
>
−
</button>


<span>

{
sleep
?
sleep+"h"
:
"--"
}

</span>



<button

onClick={()=>
setSleep(
sleep
?
sleep+0.5
:
7.5
)
}

>
+
</button>


</div>



</div>



</section>







<div className="divider"/>






<section>


<h3>
WEIGHT
</h3>


<div className="metric-row">


<div>

<div className="metric-name">

{
weight
?
`${weight} lbs`
:
"Not logged"
}

</div>


<div className="metric-sub">
Today
</div>


</div>



<div className="stepper">

<button
onClick={()=>
setWeight(
weight
?
weight-1
:
132
)
}
>
−
</button>


<span>
{
weight ?? "--"
}
</span>



<button
onClick={()=>
setWeight(
weight
?
weight+1
:
132
)
}
>
+
</button>


</div>


</div>


</section>







<div className="divider"/>




<section>


<h3>
ACTIVITY
</h3>


<div className="metric-row">


<div>


<div className="metric-name">
Workout
</div>


<div className="metric-sub">

{
workout
?
"Completed today"
:
"Not logged"
}

</div>


</div>



<button

className={
workout
?
"workout done"
:
"workout"
}


onClick={()=>
setWorkout(!workout)
}

>

{
workout
?
"Edit"
:
"Log workout"
}


</button>


</div>


</section>







<div className="divider"/>






<section>


<h3>
WELLBEING
</h3>



{
[
["Mood",mood,setMood],
["Energy",energy,setEnergy]

].map(([name,value,setter])=>(


<div className="metric-row"
key={name}>


<div>

<div className="metric-name">
{name}
</div>


<div className="metric-sub">

{
value
?
`${value} / 5`
:
"Not logged"
}

</div>


</div>




<div className="dots">

{
[1,2,3,4,5].map(n=>(

<button

key={n}

className={
value===n
?
"dot active"
:
"dot"
}

onClick={()=>
setter(n)
}

 />

))

}

</div>



</div>



))

}


</section>






<div className="divider"/>





<textarea

className="notes"

placeholder="Add a note for today..."

 />




</div>

)


}


export default Home;